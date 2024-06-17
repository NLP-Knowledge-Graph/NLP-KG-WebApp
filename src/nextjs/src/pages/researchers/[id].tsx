import { read } from "~/server/services/neo4jConnection";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, } from "next";
import type { PublicationSearch, ResearcherSearch } from "~/utils/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "~/utils/api";
import { useActiveSection } from "~/hooks";
import { useEffect, useState } from "react";
import FilterBoard, { FilterData } from "~/components/Common/FilterBoard";
import { Pagination, PaginationButton } from "~/components/Pagination";
import { ResultPublications } from "~/components/SearchResult/ResultPublications";
import { ResultResearchers } from "~/components/SearchResult/ResultResearchers";
import { ShimmerPublication } from "~/components/Shimmer/ShimmerPublication";
import { ShimmerResearcher } from "~/components/Shimmer/ShimmerResearcher";
import { BC_BAR_COLOR, BC_BAR_TOOLTIP } from "~/styles/global";

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const res = await read(`MATCH (n:Researcher) RETURN elementId(n) as id LIMIT 10`);
  const paths = res.map((x) => ({
    params: { id: encodeURIComponent(x.id as string) },
  }));
  return {
    fallback: "blocking",
    paths,
  };
};

// Make this statically generated (Keywords: Static Site Generation)
export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  const id = (params?.id as string) || "";
  const queryCypher = `MATCH (r:Researcher)
    WHERE elementId(r)='${id}'
    RETURN DISTINCT r AS researcher
    LIMIT 1`;
  const queryResult = (await read(queryCypher)).map((entry) => {
    const researcher = entry.researcher as ResearcherSearch;
    return researcher;
  });
  const result = JSON.stringify(queryResult[0]) || "";
  return {
    props: {
      id,
      result,
    },
    revalidate: 604800, // check if new data every 1 week
  };
};
export default function ResearcherView({
  id,
  result,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [page, setPage] = useState(0);
  const { activeId } = useActiveSection(["coauthors", "publications"]);

  useEffect(() => {
    setPage(0);
  }, [id]);

  type PublicationSortOption = "citation" | "recency" | "influential";
  const [publicationSortOption, setPublicationSortOption] =
    useState<PublicationSortOption>("citation");

  type ResearcherSortOption = "citation" | "publication" | "h-index";
  const [researcherSortOption, setResearcherSortOption] =
    useState<ResearcherSortOption>("citation");

  const [filterData, setFilterData] = useState<FilterData>({
    citation: 0,
    startYear: 0,
    endYear: 99999,
    venues: [],
    fields: [],
    survey: undefined
  });

  const { data: allVenueData } = api.search.all_venues.useQuery();
  const { data: allFieldData } = api.search.all_fields.useQuery();

  if (!result) {
    return <div>No result</div>;
  }
  const researcher = JSON.parse(result as string) as ResearcherSearch;
  const { data, isLoading } = api.page.researcher.useQuery({
    id: researcher.elementId,
    page,
    publicationSortOption: publicationSortOption,
    fieldFilters: filterData.fields,
    min_citation_filter: filterData.citation,
    min_date_filter: filterData.startYear,
    max_date_filter: filterData.endYear,
    venue_filters: filterData.venues,
    survey_filter: filterData.survey
  });

  const { data: researcherData, isLoading: researcherIsLoading } =
    api.page.highlightedResearcher.useQuery({ id: researcher.elementId });
  const { data: mostProminentFieldData } =
    api.page.highlightedFoSforResearcher.useQuery({ id: researcher.elementId });
  const { data: coResearcherData, isLoading: coResearcherIsLoading } =
    api.page.coresearcher.useQuery({
      id: researcher.elementId,
      coresearcherSortOption: researcherSortOption,
    });

  const mergedData: Array<{ year: number; count: number; FoS: string }> = [];

  if (researcherData?.trend && mostProminentFieldData?.trend) {
    researcherData.trend.forEach((researcherItem) => {
      const correspondingFieldItem = mostProminentFieldData.trend.find(
        (fieldItem) => fieldItem.year === researcherItem.year
      );

      if (correspondingFieldItem) {
        mergedData.push({
          year: researcherItem.year,
          count: researcherItem.count,
          FoS: correspondingFieldItem.mostProminentField,
        });
      } else {
        // If no corresponding field data is found, only push researcher data
        mergedData.push({
          year: researcherItem.year,
          count: researcherItem.count,
          FoS: "",
        });
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:flex-row md:justify-center md:gap-16">
      <div className="block w-full md:hidden">
        <ResearcherCard {...researcher} />
      </div>
      <div className="md:max-w-1/3 mt-4 hidden h-full justify-end md:flex md:flex-col md:gap-y-8">
        <ResearcherCard {...researcher} />
        <div>
          <h2 className="mb-2 text-lg">Co-authors:</h2>
          {(coResearcherIsLoading ||
            (coResearcherData?.coauthors &&
              !!coResearcherData.coauthors.length)) && (
              <>
                <div className="w-1/3 space-y-3">
                  <div className="flex items-center">
                    <span className="mr-2 whitespace-nowrap text-xs text-gray-400">
                      Sort by
                    </span>
                    <select
                      onChange={(e) =>
                        setResearcherSortOption(
                          e.target.value as ResearcherSortOption
                        )
                      }
                      value={researcherSortOption}
                      className="select select-bordered select-primary select-xs text-primary"
                    >
                      <option value="citation">Citation</option>
                      <option value="publication">Publication</option>
                      <option value="hindex">h-index</option>
                    </select>
                  </div>

                  {coResearcherIsLoading ? (
                    <div>
                      <ShimmerResearcher />
                      <ShimmerResearcher />
                      <ShimmerResearcher />
                      <ShimmerResearcher />
                    </div>
                  ) : !coResearcherData ? (
                    <div>data is empty</div>
                  ) : (
                    <ResultResearchers researchers={coResearcherData.coauthors} />
                  )}
                </div>
              </>
            )}
        </div>
      </div>

      <div className="mb-16 mr-6 flex flex-col items-center gap-4 md:w-2/3">
        <div className="m-6 flex flex-col items-center">
          <p className="mb-6 mt-8">
            Papers released by this researcher over the years:
          </p>
          <div className="w-[50vw] h-[30vh]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={600}
                height={300}
                data={researcherIsLoading || !researcherData?.trend ? [] : mergedData}
                maxBarSize={30}
              >
                <Bar type="monotone" dataKey="count" fill={BC_BAR_COLOR} />
                <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  content={(props) => (
                    <div style={{
                      border: '#bbb 1.5px solid',
                    }}>
                      <p style={{
                        margin: '0 0',
                        padding: '3px 7.5px',
                        backgroundColor: 'white',
                      }}>
                        {props.payload && props.payload[0] != null && props.payload[0].payload.year}
                      </p>
                      <p style={{
                        margin: '0 0',
                        padding: '3px 7.5px',
                        backgroundColor: 'white',
                        color: BC_BAR_TOOLTIP,
                      }}>
                        Count: {props.payload && props.payload[0] != null && props.payload[0].payload.count}
                        {/*<br />
                        Most Popular Field Of Study: {props.payload && props.payload[0] != null && props.payload[0].payload.FoS}*/}
                      </p>
                    </div>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="divider" />
        <div className="flex w-full flex-row space-x-8 md:space-x-20">
          <div className="w-[70%] p-4">
            {(isLoading || !!data?.publications.length) && (
              <div className="flex items-center">
                <span className="mr-2 text-xs text-gray-400">Sort by</span>
                <select
                  onChange={(e) =>
                    setPublicationSortOption(
                      e.target.value as PublicationSortOption
                    )
                  }
                  value={publicationSortOption}
                  className="select select-bordered select-primary select-xs text-primary"
                >
                  <option value="citation">Citation</option>
                  <option value="recency">Recency</option>
                  <option value="influential">Most Influential Papers</option>
                </select>
              </div>
            )}
            <PaginationButton
              currentPage={page}
              setCurrentPage={setPage}
              hasNext={data?.hasNext ?? false}
              hasPrevious={data?.hasPrevious ?? false}
            />
            {isLoading ? (
              <>
                <ShimmerPublication />
                <ShimmerPublication />
                <ShimmerPublication />
                <ShimmerPublication />
              </>
            ) : !data ? (
              <div>data is empty</div>
            ) : (
              <ResultPublications publications={data.publications} />
            )}
            <Pagination
              totalResults={data?.total ?? 0}
              currentPage={page}
              setCurrentPage={setPage}
              hasNext={data?.hasNext ?? false}
              hasPrevious={data?.hasPrevious ?? false}
            />
          </div>

          <div className="ml-2 w-[24%] border-l p-4">
            <FilterBoard
              venues={allVenueData?.venues}
              fields={allFieldData?.fields}
              setFilterData={setFilterData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get the number of publications per year
function getPublicationsPerYear(publications: PublicationSearch[]) {
  const publicationsPerYear: Record<string, number> = {};
  publications.forEach((publication) => {
    const year = publication.properties.publicationDate.year;
    publicationsPerYear[year] = (publicationsPerYear[year] || 0) + 1;
  });
  return Object.entries(publicationsPerYear).map(([year, count]) => ({
    year,
    count,
  }));
}

const ResearcherCard = (researcher: ResearcherSearch) => {
  return (
    <div className="card w-full border-2 bg-base-100 focus:border-black">
      <div className="relative left-8 top-5">
        <h3>Researcher:</h3>
      </div>
      <div className="card-body">
        <h1 className="text-2xl font-semibold">
          {researcher.properties.label}
        </h1>
        <div className="flex w-full justify-between">
          <span>Publications</span>
          <span className="font-semibold text-secondary">
            {researcher.properties.numberOfPublications}
          </span>
        </div>
        <div className="flex w-full justify-between">
          <span>h-index</span>
          <span className="font-semibold text-secondary">
            {researcher.properties.hIndex}
          </span>
        </div>
        <div className="flex w-full justify-between">
          <span>Citations</span>
          <span className="font-semibold text-secondary">
            {researcher.properties.numberOfCitations}
          </span>
        </div>
      </div>
    </div>
  );
};
