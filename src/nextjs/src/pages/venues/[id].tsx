import { read } from "~/server/services/neo4jConnection";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType, } from "next";
import type { Venue } from "~/utils/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import FilterBoard, { FilterData } from "~/components/Common/FilterBoard";
import { Pagination, PaginationButton } from "~/components/Pagination";
import { ShimmerPublication } from "~/components/Shimmer/ShimmerPublication";
import { ResultPublications } from "~/components/SearchResult/ResultPublications";
import { BC_BAR_COLOR, BC_BAR_TOOLTIP } from "~/styles/global";

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const res = await read(`MATCH (n:Venue) RETURN elementId(n) as id LIMIT 10`);
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
  const queryCypher = `MATCH (v:Venue)
    WHERE elementId(v)='${id}'    
    RETURN DISTINCT v AS venue
    LIMIT 1`;

  const queryResult = (await read(queryCypher)).map((entry) => {
    const venue = entry.venue as Venue;
    return venue;
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

export default function VenueView({
  id,
  result,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  type PublicationSortOption = "citation" | "recency" | "influential";
  const [publicationSortOption, setPublicationSortOption] =
    useState<PublicationSortOption>("citation");

  const [venuePage, setVenuePage] = useState(0);

  useEffect(() => {
    setVenuePage(0);
  }, [id]);

  const [filterData, setFilterData] = useState<FilterData>({
    citation: 0,
    startYear: 0,
    endYear: 99999,
    venues: [],
    fields: [],
    survey: undefined,
  });

  const { data: allVenueData } = api.search.all_venues.useQuery();
  const { data: allFieldData } = api.search.all_fields.useQuery();

  if (!result) {
    return <div>No result</div>;
  }

  const venue = JSON.parse(result as string) as Venue;

  const { data, isLoading } = api.page.venue.useQuery({
    id: venue.elementId,
    venuePage,
    publicationSortOption: publicationSortOption,
    fieldFilters: filterData.fields,
    min_citation_filter: filterData.citation,
    min_date_filter: filterData.startYear,
    max_date_filter: filterData.endYear,
    survey_filter: filterData.survey
  });

  const { data: venueData, isLoading: venueIsLoading } =
    api.page.highlightedVenue.useQuery({ id: venue.elementId });
  const { data: mostProminentFieldData } =
    api.page.highlightedFoSforVenue.useQuery({ id: venue.elementId });

  const mergedData: Array<{ year: number; count: number; FoS: string }> = [];

  if (venueData?.trend && mostProminentFieldData?.trend) {
    venueData.trend.forEach((venueItem) => {
      const correspondingFieldItem = mostProminentFieldData.trend.find(
        (fieldItem) => fieldItem.year === venueItem.year
      );

      if (correspondingFieldItem) {
        mergedData.push({
          year: venueItem.year,
          count: venueItem.count,
          FoS: correspondingFieldItem.mostProminentField,
        });
      } else {
        // If no corresponding field data is found, only push venue data
        mergedData.push({
          year: venueItem.year,
          count: venueItem.count,
          FoS: "",
        });
      }
    });
  }
  return (
    <div className="flex flex-col gap-4 p-4 md:px-20">
      <div className="flex flex-row">
        <div className="m-6 mr-4 w-[20%] rounded-xl border-2 bg-base-100 px-6 py-8 focus:border-black ">
          <h3>Venue:</h3>
          <h1 className="text-2xl font-semibold">
            {venue.properties.name}
          </h1>
          <div className="mt-4 flex w-full justify-between">
            <span>Abbreviation</span>
            <span className="font-semibold text-secondary">
              {venue.properties.abbreviation}
            </span>
          </div>
          <div className="flex w-full justify-between">
            <span>h-index</span>
            {isLoading ? (
              <div>loading</div>
            ) : !data ? (
              <div>X</div>
            ) : (
              <span className="font-semibold text-secondary">
                {venue.properties.hIndex}
              </span>
            )}
          </div>
        </div>

        <div className="m-6 flex w-[70%] flex-col items-center">
          <p className="mb-6 mt-8">
            Papers released in this venue over the years:
          </p>
          <div className="flex justify-center">
            <div className="w-[50vw] h-[30vh]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={600}
                  height={300}
                  data={venueIsLoading || !venueData?.trend ? [] : mergedData}
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
        </div>
      </div>

      <div className="divider" />
      <div className="flex flex-row gap-x-12 md:flex-row md:px-12">
        <div className="w-[20%] border-r p-4">
          <FilterBoard
            venues={allVenueData?.venues}
            fields={allFieldData?.fields}
            setFilterData={setFilterData}
            showVenues={false}
          />
        </div>
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
            currentPage={venuePage}
            setCurrentPage={setVenuePage}
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
            currentPage={venuePage}
            setCurrentPage={setVenuePage}
            hasNext={data?.hasNext ?? false}
            hasPrevious={data?.hasPrevious ?? false}
          />
        </div>
      </div>
    </div>
  );
}
