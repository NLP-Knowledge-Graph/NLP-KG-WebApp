import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { read } from "~/server/services/neo4jConnection";
import { getPublications } from "~/server/services/pythonConnection";
import type {
  Field,
  FieldSearch,
  PublicationSearch,
  ResearcherSearch,
  Venue,
} from "~/utils/types";

// The router for /search feature
export const searchRouter = createTRPCRouter({
  // Search for publications using the python service for ranking
  publication: publicProcedure
    .input(
      z.object({
        queryString: z.string(),
        sortOption: z.string(),
        fieldFilters: z.string().array(),
        offset: z.number(),
        searchType: z.string(),
        min_citation_filter: z.number(),
        min_date_filter: z.number(),
        max_date_filter: z.number(),
        venue_filters: z.string().array(),
        survey_filter: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let publicationsCypher: string;
      let publicationsResult;
      let hasNext: boolean;
      let total = 0;
      const hasPrevious = input.offset !== 0;

      let papersPerYear;
      if (input.queryString) {
        const res = await getPublications({
          query_string: input.queryString,
          field_filters: input.fieldFilters,
          limit: 10,
          offset: input.offset,
          sort_option: input.sortOption,
          search_type: input.searchType,
          min_citation_filter: input.min_citation_filter,
          min_date_filter: input.min_date_filter,
          max_date_filter: input.max_date_filter,
          venue_filters: input.venue_filters,
          survey_filter: input.survey_filter,
        });
        const idList = res.papers.map((x) => x.neo4jID);

        hasNext = res.hasNext;
        total = res.total;

        // with string
        publicationsCypher = `MATCH (p:Publication)
            WHERE elementId(p) IN $idList
            WITH p
            MATCH (p)-[:HAS_FIELD_OF_STUDY]-(f)
            WITH p, COLLECT(DISTINCT f) AS fields
            MATCH (p)-[:PUBLISHED_AT]-(venue)
            RETURN p AS publication, fields, venue`;
        publicationsResult = await read(publicationsCypher, { idList: idList });

        papersPerYear = Object.entries(res.statistics).map(([key, value]) => ({
          year: key,
          count: value,
        }));
      } else {
        const sortString =
          { recency: "publicationDate", citations: "numberOfCitations" }[
            input.sortOption
          ] || "numberOfCitations";

        // (No string)
        publicationsCypher = `MATCH (p:Publication)
          WITH p

          WHERE p.numberOfCitations >= ${input.min_citation_filter}
          AND p.publicationDate.year >= ${input.min_date_filter}
          AND p.publicationDate.year <= ${input.max_date_filter}
          ${input.survey_filter === true ? "AND p:Survey" : ""}
          
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
          WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList
          
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
          WITH p, COLLECT(DISTINCT ff) AS fields

          MATCH (p)-[:PUBLISHED_AT]-(venue)
          WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList
          
          WITH p, fields, venue
          ORDER BY p.${sortString} DESC
          SKIP ${input.offset}
          LIMIT 11
    
          RETURN p AS publication, fields, venue`;

        // Calculate statistics for papers per year
        // can be added: WHERE elementId(p) IN $idList
        const yearStatisticsCypher = `MATCH (p:Publication)
      WITH p
      WHERE p.numberOfCitations >= ${input.min_citation_filter}
      AND p.publicationDate.year >= ${input.min_date_filter}
      AND p.publicationDate.year <= ${input.max_date_filter}
      ${input.survey_filter === true ? "AND p:Survey" : ""}

      MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
      WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

      MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
      WITH p, COLLECT(DISTINCT ff) AS fields

      MATCH (p)-[:PUBLISHED_AT]-(venue)
      WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList

      WITH p, p.publicationDate.year AS year
      ORDER BY year
      RETURN year, COUNT(p) AS count`;

        const yearStatistics = await read(yearStatisticsCypher, {
          fosIdList: input.fieldFilters,
          venueAbvList: input.venue_filters,
        });
        papersPerYear = yearStatistics.map(({ year, count }) => ({
          year,
          count,
        }));

        const publicationsTotal = `MATCH (p:Publication)
          WITH p
          WHERE p.numberOfCitations >= ${input.min_citation_filter}
          AND p.publicationDate.year >= ${input.min_date_filter}
          AND p.publicationDate.year <= ${input.max_date_filter}
          ${input.survey_filter === true ? "AND p:Survey" : ""}
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
          WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
          WITH p, COLLECT(DISTINCT ff) AS fields

          MATCH (p)-[:PUBLISHED_AT]-(venue)
          WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList

          RETURN count(p) as count`;
        const result = await read(publicationsCypher, {
          fosIdList: input.fieldFilters,
          venueAbvList: input.venue_filters,
        });
        total =
          (
            await read(publicationsTotal, {
              fosIdList: input.fieldFilters,
              venueAbvList: input.venue_filters,
            })
          ).map((e) => e.count as number)[0] ?? 0;
        hasNext = result.length > 10;

        publicationsResult = result.slice(0, 10);
      }

      publicationsResult = publicationsResult.map((entry) => {
        return {
          ...entry.publication,
          fields: entry.fields as Field[],
          venue: entry.venue as Venue,
        } as PublicationSearch;
      });

      return {
        publications: publicationsResult,
        hasNext,
        hasPrevious,
        total,
        papersPerYear,
      };
    }),
  // Search for researchers
  researcher: publicProcedure
    .input(
      z.object({
        queryString: z.string(),
        sortOption: z.string(),
        fieldFilters: z.string().array(),
        offset: z.number(),
        idList: z.string().array(),
      })
    )
    .query(async ({ input }) => {
      const optionString =
        {
          citation: "numberOfCitations",
          publication: "numberOfPublications",
          hindex: "hIndex",
        }[input.sortOption] || "numberOfCitations";

      let researchersCypher = `MATCH (r:Researcher)
        WHERE $queryString IS NULL OR toLower(r.label) CONTAINS toLower($queryString)   
        WITH r
        MATCH (r)-[:IS_AUTHOR_OF]->(p)-[:HAS_FIELD_OF_STUDY]-(f)
        WHERE $fieldFilters IS NULL OR size($fieldFilters)=0 OR elementId(f) IN $fieldFilters
        WITH DISTINCT r
        ORDER BY r.${optionString} DESC
        LIMIT 10
        RETURN r AS researcher`;

      let researchersResult = (
        await read(researchersCypher, {
          queryString: input.queryString,
          fieldFilters: input.fieldFilters,
        })
      ).map((entry) => {
        return entry.researcher as ResearcherSearch;
      });

      if (researchersResult.length == 0 && input.idList.length > 0) {
        //do researcher filtrelerini de sil
        researchersCypher = `MATCH (p:Publication)-[:HAS_AUTHOR]->(r:Researcher)
        WHERE elementId(p) IN $idList
        WITH r
        MATCH (r)-[:IS_AUTHOR_OF]->(p)-[:HAS_FIELD_OF_STUDY]-(f)
        WHERE $fieldFilters IS NULL OR size($fieldFilters)=0 OR elementId(f) IN $fieldFilters
        WITH DISTINCT r
        ORDER BY r.${optionString} DESC
        LIMIT 10
        RETURN r AS researcher`;

        researchersResult = (
          await read(researchersCypher, {
            idList: input.idList,
            fieldFilters: input.fieldFilters,
          })
        ).map((entry) => {
          return entry.researcher as ResearcherSearch;
        });
      }

      return {
        researchers: researchersResult,
      };
    }),
  // Search for fields of study
  field: publicProcedure
    .input(z.object({ queryString: z.string(), idList: z.string().array() }))
    .query(async ({ input }) => {
      let fieldsCypher = `MATCH (f:FieldOfStudy)
        WHERE ($queryString IS NULL OR toLower(f.label) CONTAINS toLower($queryString))
        WITH f
        ORDER BY f.numberOfPublications DESC
        LIMIT 10
        OPTIONAL MATCH (f)-[:SUPERFIELD_OF]->(f_sub)
        WITH f, COLLECT(DISTINCT f_sub) as subfields
        OPTIONAL MATCH (f)-[:SUBFIELD_OF*]->(f_sup)
        WITH f, subfields, COLLECT(DISTINCT f_sup) as supfields
        RETURN f AS fieldOfStudy, subfields, supfields`;

      let fieldsResult = (
        await read(fieldsCypher, { queryString: input.queryString })
      ).map((entry) => {
        entry.fieldOfStudy.subfields = entry.subfields;
        entry.fieldOfStudy.supfields = entry.supfields;

        return entry.fieldOfStudy as FieldSearch;
      });

      if (fieldsResult.length == 0 && input.idList.length > 0) {
        fieldsCypher = `MATCH (p:Publication)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
            WHERE elementId(p) IN $idList
            WITH f, COUNT(f) as fCount
            ORDER BY fCount DESC
            OPTIONAL MATCH (f)-[:SUPERFIELD_OF]->(f_sub)
            WITH f, COLLECT(DISTINCT f_sub) as subfields
            OPTIONAL MATCH (f)-[:SUBFIELD_OF*]->(f_sup)
            WITH f, subfields, COLLECT(DISTINCT f_sup) as supfields
            LIMIT 10
            RETURN f AS fieldOfStudy, subfields, supfields`;

        fieldsResult = (await read(fieldsCypher, { idList: input.idList })).map(
          (entry) => {
            entry.fieldOfStudy.subfields = entry.subfields;
            entry.fieldOfStudy.supfields = entry.supfields;
            return entry.fieldOfStudy as FieldSearch;
          }
        );
      }

      return {
        fields: fieldsResult,
      };
    }),
  // Retrieve all venues
  all_venues: publicProcedure.query(async () => {
    const venuesCypher = `MATCH (v:Venue)
        WITH v
        ORDER BY v.numberOfPublications DESC
        RETURN v.abbreviation AS venue`;

    const venuesResult = (await read(venuesCypher)).map((entry) => {
      return entry.venue as string;
    });

    return {
      venues: venuesResult as string[],
    };
  }),

  // Retrieve all fields of study
  all_fields: publicProcedure.query(async () => {
    const fieldsCypher = `MATCH (n:FieldOfStudy)
        WITH n
        RETURN elementId(n) AS id, n.label AS name `;

    const fieldsResult = (await read(fieldsCypher)).map((entry) => {
      return { id: entry.id, name: entry.name };
    });

    return {
      fields: fieldsResult,
    };
  }),
});
