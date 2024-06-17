import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { read } from "~/server/services/neo4jConnection";
import type { PublicationSearch, ResearcherSearch } from "~/utils/types";
// The router in each individual pages
export const pageRouter = createTRPCRouter({
  venue: publicProcedure
    .input(z.object({
      id: z.string(),
      venuePage: z.number(),
      publicationSortOption: z.string(),
      fieldFilters: z.string().array(),
      min_citation_filter: z.number(),
      min_date_filter: z.number(),
      max_date_filter: z.number(),
      survey_filter: z.boolean().optional()
    }))
    .query(async ({ input }) => {
      const publicationSortString =
        { recency: "publicationDate", citations: "numberOfCitations", influential: "numberOfInfluentialCitations" }[
        input.publicationSortOption
        ] || "numberOfCitations";

      const publicationsCypher = `MATCH (curV:Venue)
        WHERE elementId(curV)=$id
        WITH curV
        MATCH (curV)<-[:PUBLISHED_AT]-(p)
        
        WHERE p.numberOfCitations >= ${input.min_citation_filter}
        AND p.publicationDate.year >= ${input.min_date_filter}
        AND p.publicationDate.year <= ${input.max_date_filter}
        ${input.survey_filter !== undefined ? input.survey_filter ? "AND p:Survey" : "AND NOT p:Survey" : ""}

        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
        WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
        WITH p, COLLECT(DISTINCT ff) AS fields

        MATCH (p)-[:PUBLISHED_AT]-(venue)

        WITH p, fields, venue
        ORDER BY p.${publicationSortString} DESC
        SKIP ${input.venuePage * 10}
        LIMIT 11
        RETURN p AS publication, fields, venue`;

      const publicationsResult = (
        await read(publicationsCypher, { id: input.id, fosIdList: input.fieldFilters })
      ).map((entry) => {
        entry.publication.fields = entry.fields;
        entry.publication.venue = entry.venue;
        return entry.publication as PublicationSearch;
      });
      const publicationsTotal = `
        MATCH (curV:Venue)
          WHERE elementId(curV)=$id
          WITH curV
          MATCH (curV)<-[:PUBLISHED_AT]-(p)
          WHERE p.numberOfCitations >= ${input.min_citation_filter}
          AND p.publicationDate.year >= ${input.min_date_filter}
          AND p.publicationDate.year <= ${input.max_date_filter}
          ${input.survey_filter === true ? "AND p:Survey" : ""}

          WITH DISTINCT p
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
          WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
          WITH p, COLLECT(DISTINCT ff) AS fields
          RETURN count(p) as count
      `;
      const total = (await read(publicationsTotal, { id: input.id, fosIdList: input.fieldFilters })).map(e => e.count as number)[0];
      return {
        publications: publicationsResult.slice(0, 10),
        hasNext: publicationsResult.length > 10,
        hasPrevious: input.venuePage > 0,
        total: total ?? 0,
      };
    }),
  researcher: publicProcedure
    .input(z.object({
      id: z.string(),
      page: z.number(),
      publicationSortOption: z.string(),
      fieldFilters: z.string().array(),
      min_citation_filter: z.number(),
      min_date_filter: z.number(),
      max_date_filter: z.number(),
      venue_filters: z.string().array(),
      survey_filter: z.boolean().optional()
    }))
    .query(async ({ input }) => {
      const publicationSortString =
        { recency: "publicationDate", citations: "numberOfCitations", influential: "numberOfInfluentialCitations" }[
        input.publicationSortOption
        ] || "numberOfCitations";
      const publicationsCypher = `MATCH (curR:Researcher)
        WHERE elementId(curR)=$id
        WITH curR
        MATCH (curR)-[:IS_AUTHOR_OF]->(p)
        WHERE p.numberOfCitations >= ${input.min_citation_filter}
        AND p.publicationDate.year >= ${input.min_date_filter}
        AND p.publicationDate.year <= ${input.max_date_filter}
        ${input.survey_filter === true ? "AND p:Survey" : ""}
        
        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
        WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
        WITH p, COLLECT(DISTINCT ff) AS fields

        MATCH (p)-[:PUBLISHED_AT]-(venue)
        WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList
        
        WITH p, fields, venue
        ORDER BY p.${publicationSortString} DESC
        SKIP ${input.page * 10}
        LIMIT 11

        RETURN p AS publication, fields, venue`;
      const publicationsTotal = `MATCH (curR:Researcher)
        WHERE elementId(curR)=$id
        WITH curR
        MATCH (curR)-[:IS_AUTHOR_OF]->(p)
        WHERE p.numberOfCitations >= ${input.min_citation_filter}
        AND p.publicationDate.year >= ${input.min_date_filter}
        AND p.publicationDate.year <= ${input.max_date_filter}
        ${input.survey_filter !== undefined ? input.survey_filter ? "AND p:Survey" : "AND NOT p:Survey" : ""}
        
        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
        WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
        WITH p, COLLECT(DISTINCT ff) AS fields
        
        MATCH (p)-[:PUBLISHED_AT]-(venue)
        WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList

        RETURN count(p) as count`;

      const publicationsResult = (
        await read(publicationsCypher, { id: input.id, fosIdList: input.fieldFilters, venueAbvList: input.venue_filters })
      ).map((entry) => {
        entry.publication.fields = entry.fields;
        entry.publication.venue = entry.venue;
        return entry.publication as PublicationSearch;
      });
      const total = (await read(publicationsTotal, { id: input.id, fosIdList: input.fieldFilters, venueAbvList: input.venue_filters })).map(
        (e) => e.count as number
      )[0];
      return {
        publications: publicationsResult.slice(0, 10),
        hasNext: publicationsResult.length > 10,
        hasPrevious: input.page > 0,
        total: total ?? 0,
      };
    }),

  coresearcher: publicProcedure
    .input(z.object({ id: z.string(), coresearcherSortOption: z.string() }))
    .query(async ({ input }) => {
      const coresearcherSortString =
        {
          citation: "numberOfCitations",
          publication: "numberOfPublications",
          hindex: "hIndex",
        }[input.coresearcherSortOption] || "numberOfCitations";

      const coauthorsCypher = `MATCH (curR:Researcher)
        WHERE elementId(curR)=$id
        WITH curR
        MATCH (r)-[:IS_AUTHOR_OF]->()<-[:IS_AUTHOR_OF]-(curR)
        WHERE r <> curR
        WITH DISTINCT r
        ORDER BY r.${coresearcherSortString} DESC
        RETURN r as researcher
        LIMIT 10`;
      const coauthorsResult = (
        await read(coauthorsCypher, { id: input.id })
      ).map((entry) => {
        return entry.researcher as ResearcherSearch;
      });
      return {
        coauthors: coauthorsResult,
      };
    }),

  publicationCitations: publicProcedure
    .input(
      z.object({
        id: z.string(),
        citationsPage: z.number(),
        citationsSortOption: z.string()
      })
    )
    .query(async ({ input }) => {

      const citationsSortString =
        { recency: "publicationDate", citations: "numberOfCitations" }[
        input.citationsSortOption
        ] || "numberOfCitations";

      const citationsCypher = `MATCH (curP:Publication)
        WHERE elementId(curP)=$id
        WITH curP
        MATCH (curP)-[:IS_REFERENCED_BY]->(p)
        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f)
        WITH p, COLLECT(DISTINCT f) AS fields
        MATCH (p)-[:PUBLISHED_AT]-(venue)
        WITH p, fields, venue
        ORDER BY p.${citationsSortString} DESC
        SKIP ${input.citationsPage * 10}
        LIMIT 11
        RETURN p AS publication, fields, venue`;

      const citationsTotalCypher = `MATCH (curP:Publication)
        WHERE elementId(curP)=$id
        WITH curP
        MATCH (curP)-[:IS_REFERENCED_BY]->(p)
        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f)
        WITH p, COLLECT(DISTINCT f) AS fields
        MATCH (p)-[:PUBLISHED_AT]-(venue)
        RETURN count(p) as count`;

      const citationsResult = (
        await read(citationsCypher, { id: input.id })
      ).map((entry) => {
        entry.publication.fields = entry.fields;
        entry.publication.venue = entry.venue;
        return entry.publication as PublicationSearch;
      });

      const citationsTotal = (
        await read(citationsTotalCypher, { id: input.id })
      ).map((e) => e.count as number)[0];

      return {
        citations: citationsResult.slice(0, 10),
        hasNext: citationsResult.length > 10,
        hasPrevious: input.citationsPage > 0,
        total: citationsTotal ?? 0,
      };
    }),

  publicationReferences: publicProcedure
    .input(
      z.object({
        id: z.string(),
        referencesPage: z.number(),
        referencesSortOption: z.string(),
      })
    )
    .query(async ({ input }) => {
      const referencesSortString =
        { recency: "publicationDate", citations: "numberOfCitations" }[
        input.referencesSortOption
        ] || "numberOfCitations";
      const referencesCypher = `MATCH (curP:Publication)
        WHERE elementId(curP)=$id
        WITH curP
        MATCH (curP)-[:REFERENCES]->(p)
        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f)
        WITH p, COLLECT(DISTINCT f) AS fields
        MATCH (p)-[:PUBLISHED_AT]-(venue)
        WITH p, fields, venue
        ORDER BY p.${referencesSortString} DESC
        SKIP ${input.referencesPage * 10}
        LIMIT 11
        RETURN p AS publication, fields, venue`;
      const referencesTotalCypher = `MATCH (curP:Publication)
          WHERE elementId(curP)=$id
          WITH curP
          MATCH (curP)-[:REFERENCES]->(p)
          WITH DISTINCT p
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f)
          WITH p, COLLECT(DISTINCT f) AS fields
          MATCH (p)-[:PUBLISHED_AT]-(venue)
          RETURN count(p) as count`;

      const referencesResult = (
        await read(referencesCypher, { id: input.id })
      ).map((entry) => {
        entry.publication.fields = entry.fields;
        entry.publication.venue = entry.venue;
        return entry.publication as PublicationSearch;
      });

      const referencesTotal = (
        await read(referencesTotalCypher, {
          id: input.id,
        })
      ).map((e) => e.count as number)[0];
      return {
        references: referencesResult.slice(0, 10),
        hasNext: referencesResult.length > 10,
        hasPrevious: input.referencesPage > 0,
        total: referencesTotal ?? 0,
      };
    }),

  field: publicProcedure
    .input(z.object({
      id: z.string(),
      page: z.number(),
      publicationSortOption: z.string(),
      fieldFilters: z.string().array(),
      min_citation_filter: z.number(),
      min_date_filter: z.number(),
      max_date_filter: z.number(),
      venue_filters: z.string().array(),
      survey_filter: z.boolean().optional()
    }))
    .query(async ({ input }) => {

      const publicationSortString =
        { recency: "publicationDate", citations: "numberOfCitations", influential: "numberOfInfluentialCitations" }[
        input.publicationSortOption
        ] || "numberOfCitations";

      const publicationsCypher = `MATCH (f: FieldOfStudy)
        WHERE elementId(f)=$id
        WITH f
        MATCH (f)-[:IS_STUDIED_IN]-(p)

        WHERE p.numberOfCitations >= ${input.min_citation_filter}
        AND p.publicationDate.year >= ${input.min_date_filter}
        AND p.publicationDate.year <= ${input.max_date_filter}
        ${input.survey_filter === true ? "AND p:Survey" : ""}

        WITH DISTINCT p
        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
        WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList

        MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
        WITH p, COLLECT(DISTINCT ff) AS fields

        MATCH (p)-[:PUBLISHED_AT]-(venue)
        WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList

        WITH p, fields, venue
        ORDER BY p.${publicationSortString} DESC
        SKIP ${input.page * 10}
        LIMIT 11
        
        RETURN p AS publication, fields, venue`;
      const publicationsTotalCypher = `MATCH (f: FieldOfStudy)
          WHERE elementId(f)=$id
          WITH f
          MATCH (f)-[:IS_STUDIED_IN]-(p)
          WHERE p.numberOfCitations >= ${input.min_citation_filter}
          AND p.publicationDate.year >= ${input.min_date_filter}
          AND p.publicationDate.year <= ${input.max_date_filter}
          ${input.survey_filter !== undefined ? input.survey_filter ? "AND p:Survey" : "AND NOT p:Survey" : ""}
          
          WITH DISTINCT p
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
          WHERE size($fosIdList) = 0 OR elementId(f) IN $fosIdList
          MATCH (p)-[:HAS_FIELD_OF_STUDY]->(ff:FieldOfStudy)
          WITH p, COLLECT(DISTINCT ff) AS fields
          MATCH (p)-[:PUBLISHED_AT]-(venue)
          WHERE size($venueAbvList) = 0 OR venue.abbreviation IN $venueAbvList
          RETURN count(p) as count`;
      const publicationsResult = (
        await read(publicationsCypher, { id: input.id, fosIdList: input.fieldFilters, venueAbvList: input.venue_filters })
      ).map((entry) => {
        entry.publication.fields = entry.fields;
        entry.publication.venue = entry.venue;
        return entry.publication as PublicationSearch;
      });
      const publicationsTotal = (
        await read(publicationsTotalCypher, { id: input.id, fosIdList: input.fieldFilters, venueAbvList: input.venue_filters })
      ).map((e) => e.count as number)[0];

      return {
        publications: publicationsResult.slice(0, 10),
        total: publicationsTotal ?? 0,
        hasNext: publicationsResult.length > 10,
        hasPrevious: input.page > 0,
      };
    }),
  fieldAuthors: publicProcedure
    .input(z.object({ id: z.string(), researcherSortOption: z.string() }))
    .query(async ({ input }) => {

      const researcherSortString =
        {
          citation: "numberOfCitations",
          publication: "numberOfPublications",
          hindex: "hIndex",
        }[input.researcherSortOption] || "numberOfCitations";

      const researchersCypher = `MATCH (f: FieldOfStudy)
      WHERE elementId(f)=$id
      WITH f
      MATCH (f)-[:IS_STUDIED_IN]-(p)-[:HAS_AUTHOR]->(r)
      WITH DISTINCT r
      ORDER BY r.${researcherSortString} DESC
      RETURN r as researcher
      LIMIT 19`;

      const researchersResult = (
        await read(researchersCypher, { id: input.id })
      ).map((entry) => {
        return entry.researcher as ResearcherSearch;
      });
      return {
        researchers: researchersResult,
      };
    }),

  highlightedField: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trendCypher = `MATCH (curF: FieldOfStudy)
        WHERE elementId(curF)=$id
        WITH curF
        MATCH (curF)-[:IS_STUDIED_IN]->(p)
        RETURN DISTINCT p.publicationDate.year AS year, count(*) AS count
        ORDER BY year ASC`;
      const trendResult = (await read(trendCypher, { id: input.id })) as {
        year: number;
        count: number;
      }[];
      return {
        trend: trendResult,
      };
    }),

  highlightedVenue: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trendCypher = `MATCH (curV:Venue)
        WHERE elementId(curV)=$id
        WITH curV
        MATCH (curV)<-[:PUBLISHED_AT]-(p)
        RETURN DISTINCT p.publicationDate.year AS year, count(*) AS count
        ORDER BY year ASC`;
      const trendResult = (await read(trendCypher, { id: input.id })) as {
        year: number;
        count: number;
      }[];
      return {
        trend: trendResult,
      };
    }),

  highlightedResearcher: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trendCypher = `MATCH (curR:Researcher)
        WHERE elementId(curR)=$id
        WITH curR
        MATCH (curR)-[:IS_AUTHOR_OF]->(p)
        RETURN DISTINCT p.publicationDate.year AS year, count(*) AS count
        ORDER BY year ASC`;
      const trendResult = (await read(trendCypher, { id: input.id })) as {
        year: number;
        count: number;
      }[];
      return {
        trend: trendResult,
      };
    }),

  highlightedFoSforResearcher: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trendCypher = `MATCH (curR:Researcher)
        WHERE elementId(curR) = $id
        WITH curR
        MATCH (curR)-[:IS_AUTHOR_OF]->(p)-[:HAS_FIELD_OF_STUDY]->(curF:FieldOfStudy)
        WITH p.publicationDate.year AS year, curF, count(*) AS count
        ORDER BY year ASC, count DESC
        WITH year, COLLECT({fieldOfStudy: curF, count: count})[0] AS topField
        RETURN year, topField.fieldOfStudy.label AS mostProminentField
        ORDER BY year ASC`;
      const trendResult = (await read(trendCypher, { id: input.id })) as {
        year: number;
        mostProminentField: string;
      }[];
      return {
        trend: trendResult,
      };
    }),

  highlightedFoSforVenue: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trendCypher = ` MATCH (curV:Venue)
        WHERE elementId(curV)=$id
        WITH curV
        MATCH (curV)<-[:PUBLISHED_AT]-(p)-[:HAS_FIELD_OF_STUDY]->(curF:FieldOfStudy)
        WITH p.publicationDate.year AS year, curF, count(*) AS count
        ORDER BY year ASC, count DESC
        WITH year, COLLECT({fieldOfStudy: curF, count: count})[0] AS topField
        RETURN year, topField.fieldOfStudy.label AS mostProminentField
        ORDER BY year ASC`;
      const trendResult = (await read(trendCypher, { id: input.id })) as {
        year: number;
        mostProminentField: string;
      }[];
      return {
        trend: trendResult,
      };
    }),
});
