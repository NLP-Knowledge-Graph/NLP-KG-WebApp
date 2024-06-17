import {type NextPage} from "next";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import FilterBoard, {FilterData} from "~/components/Common/FilterBoard";
import {api} from "~/utils/api";
import type {FieldSearch} from "~/utils/types";
import {getToggleState} from "~/context/ToggleContext";
import {Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis} from "recharts";
import {useSession} from "next-auth/react";
import {Pagination, PaginationButton} from "~/components/Pagination";
import {ResultPublications} from "~/components/SearchResult/ResultPublications";
import {ResultResearchers} from "~/components/SearchResult/ResultResearchers";
import {ResultFields} from "~/components/SearchResult/ResultFields";
import {ShimmerField} from "~/components/Shimmer/ShimmerField";
import {ShimmerPublication} from "~/components/Shimmer/ShimmerPublication";
import {ShimmerResearcher} from "~/components/Shimmer/ShimmerResearcher";
import {BC_BAR_COLOR} from "~/styles/global";

const SearchPage: NextPage = () => {
  const [fieldFilters, setFieldFilters] = useState<FieldSearch[]>([]);

  const router = useRouter();

  type PublicationSortOption = "citation" | "recency" | "relevancy" | "influential";
  type ResearcherSortOption = "citation" | "publication" | "h-index";

  const [publicationSortOption, setPublicationSortOption] =
    useState<PublicationSortOption>("relevancy");
  const [researcherSortOption, setResearcherSortOption] =
    useState<ResearcherSortOption>("citation");

  const [publicationsPage, setPublicationsPage] = useState(0);

  const [filterData, setFilterData] = useState<FilterData>({
    citation: 0,
    startYear: 0,
    endYear: 99999,
    venues: [],
    fields: [],
    survey: undefined,
  });

  const toggleFilter = (field: FieldSearch) => {
    if (fieldFilters.includes(field)) {
      setFieldFilters(
        fieldFilters.filter((filterField) => filterField !== field)
      );
    } else {
      setFieldFilters([...fieldFilters, field]);
    }
  };

  const queryString = (router.query.keyword as string) || "";
  const searchType = getToggleState().isToggled ? "default" : "string";

  const { data: session } = useSession();
  const { data: profileData } = api.profile.get.useQuery(undefined, {
    enabled: session !== undefined && session !== null,
  });

  const { data: publicationData, isLoading: publicationIsLoading } =
    api.search.publication.useQuery({
      queryString: queryString,
      sortOption: publicationSortOption,
      fieldFilters: filterData.fields,
      offset: publicationsPage * 10,
      searchType: searchType,
      min_citation_filter: filterData.citation,
      min_date_filter: filterData.startYear,
      max_date_filter: filterData.endYear,
      venue_filters: filterData.venues,
      survey_filter: filterData.survey,
    });
  const publicationIds = publicationData?.publications.map((x) => x.elementId);

  const { data: researcherData, isLoading: researcherIsLoading } =
    api.search.researcher.useQuery({
      queryString: queryString,
      sortOption: researcherSortOption,
      fieldFilters: fieldFilters.map((x) => x.elementId),
      offset: publicationsPage * 10,
      idList: publicationIds || [],
    });

  const { data: fieldData, isLoading: fieldIsLoading } =
    api.search.field.useQuery({
      queryString: queryString,
      idList: publicationIds || [],
    });

  const { data: allVenueData } = api.search.all_venues.useQuery();

  const { data: allFieldData } = api.search.all_fields.useQuery();

  const publicationsToUseInChatBot = [];
  for (
    let i = 0;
    i < Math.min(5, publicationData?.publications.length || 0);
    i++
  ) {
    if (publicationsPage == 0) {
      publicationsToUseInChatBot.push(
        publicationData?.publications[i]?.properties.publicationTitle
      );
    }
  }

  useEffect(() => {
    if (queryString !== "") setPublicationsPage(0);
  }, [queryString]);

  return (
    <div
      id="search"
      className="max-w-screen flex min-h-screen flex-col overflow-x-hidden"
    >
      {/* Results of the query */}
      <div className="mb-12 ">
        {/* Field of Study */}
        {(fieldIsLoading || (fieldData && !!fieldData.fields.length)) && (
          <div className="mb-5 w-full">
            <div className="p-auto m-auto flex flex-col bg-white">
              <div className="mb-4 ml-4 flex w-[50%] flex-col space-y-3 md:ml-48">
                <h3 className="mr-8 text-sm text-gray-400">
                  {queryString ? (
                    <p>Fields of Study found for &quot;{queryString}&quot;</p>
                  ) : (
                    <p>Top Fields of Study</p>
                  )}
                </h3>
              </div>
              {fieldIsLoading ? (
                <div className="flex flex-row space-x-4 md:ml-48">
                  <ShimmerField />
                  <ShimmerField />
                  <ShimmerField />
                  <ShimmerField />
                </div>
              ) : !fieldData ? (
                <div>Data is empty</div>
              ) : (
                <ResultFields
                  fields={fieldData.fields}
                  toggleFilter={toggleFilter}
                  fieldFilters={fieldFilters}
                />
              )}
            </div>
          </div>
        )}

        {/* Papers & Researchers */}
        <div className="mt-6 flex w-full flex-row space-x-20">
          {/* Result Publications */}
          <div className="ml-2 w-[17%] border-r p-4">
            <FilterBoard
              venues={allVenueData?.venues}
              fields={allFieldData?.fields}
              setFilterData={setFilterData}
            />
          </div>
          <div className="w-[70%] px-[2%]">
            <div className="mb-4 flex flex-row justify-between">
              <div>
                <h3 className="text-sm text-gray-400">
                  {fieldFilters && !!fieldFilters.length ? (
                    <div>
                      <div className="mb-2 flex">
                        <span>
                          Showing publications containing field
                          {fieldFilters.length > 1 && "s"}:
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <div
                          className="btn-xs ml-2 flex w-fit cursor-pointer flex-wrap rounded-xl border-2 text-gray-400 hover:text-black"
                          onClick={() => setFieldFilters([])}
                        >
                          Clear All
                        </div>
                        {fieldFilters.map((field) => {
                          return (
                            <div
                              className="group btn-xs flex w-fit cursor-pointer flex-wrap items-center rounded-xl border-2 text-gray-400"
                              key={field.elementId}
                              onClick={() => toggleFilter(field)}
                            >
                              {field.properties.label}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-4 w-4 group-hover:text-black"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : queryString ? (
                    <p>Publications found for &quot;{queryString}&quot;</p>
                  ) : (
                    <p>Top Publications</p>
                  )}
                </h3>
                {(publicationIsLoading ||
                  !!publicationData?.publications.length) && (
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
                        <option value="relevancy">Relevancy</option>
                        <option value="citation">Citation</option>
                        <option value="recency">Recency</option>
                        <option value="influential">Most Influential Papers</option>
                      </select>
                    </div>
                  )}
              </div>
              <PaginationButton
                currentPage={publicationsPage}
                setCurrentPage={setPublicationsPage}
                hasNext={publicationData?.hasNext ?? false}
                hasPrevious={publicationData?.hasPrevious ?? false}
              />
            </div>
            <div className="flex justify-center"> {/* Centering the publications */}
              <div className="w-full flex flex-col items-center">
                {publicationIsLoading ? (
                    <>
                      <ShimmerPublication/>
                      <ShimmerPublication/>
                      <ShimmerPublication/>
                      <ShimmerPublication/>
                    </>
                ) : !publicationData ? (
                    <div>data is empty</div>
                ) : (
                    <div className="w-full">
                      {/* Wrapping ResultPublications in a container div */}
                      <div className="flex justify-center">
                        <ResultPublications publications={publicationData.publications}/>
                      </div>
                    </div>
                )}
              </div>
            </div>
            <Pagination
              totalResults={publicationData?.total ?? 0}
              currentPage={publicationsPage}
              setCurrentPage={setPublicationsPage}
              hasNext={publicationData?.hasNext ?? false}
              hasPrevious={publicationData?.hasPrevious ?? false}
            />
          </div>

          {/* Researchers and Bar Chart Container */}
          <div className="flex flex-col items-center justify-top w-[20%]">
            {/* Bar Chart */}
            <div className="m-6 flex flex-col items-center">
              <p className="mb-6 mt-8 whitespace-nowrap">
                Papers released over the years:
              </p>
              <div className="flex justify-center">
                <BarChart
                  width={400}
                  height={200}
                  data={
                    publicationIsLoading || !publicationData?.papersPerYear
                      ? []
                      : publicationData.papersPerYear
                  }
                  maxBarSize={30}
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={BC_BAR_COLOR} />
                </BarChart>
              </div>
            </div>

            {/* Researchers */}
            <div className="mt-6">
              {(researcherIsLoading ||
                  (researcherData && !!researcherData.researchers.length)) && (
                  <>
                    <div className="mb-4 flex flex-col space-y-3">
                      <h3 className=" text-sm text-gray-400">
                        {queryString ? (
                            <p>Researchers found for &quot;{queryString}&quot;</p>
                        ) : (
                            <p>Top Researchers</p>
                        )}
                      </h3>
                      <div className="flex items-center">
                        <span className="mr-2 text-xs text-gray-400">Sort by</span>
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
                    </div>

                    {researcherIsLoading ? (
                        <div>
                          <ShimmerResearcher/>
                          <ShimmerResearcher/>
                          <ShimmerResearcher/>
                          <ShimmerResearcher/>
                        </div>
                    ) : !researcherData ? (
                        <div>data is empty</div>
                    ) : (
                        <ResultResearchers researchers={researcherData.researchers}/>
                    )}
                  </>
              )}
            </div>
          </div>
          <div className="ml-2 w-[12%] border-r p-4"></div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
