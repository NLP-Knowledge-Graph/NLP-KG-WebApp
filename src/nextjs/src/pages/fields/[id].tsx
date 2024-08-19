import type {GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType,} from "next";
import {useEffect, useRef, useState} from "react";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {env} from "~/env.cjs";
import {read} from "~/server/services/neo4jConnection";
import {api} from "~/utils/api";
import type {DataType, Field, FieldWithParent} from "~/utils/types";
import FilterBoard, {FilterData} from "~/components/Common/FilterBoard";
import {Pagination, PaginationButton} from "~/components/Pagination";
import {ResultPublications} from "~/components/SearchResult/ResultPublications";
import {ResultResearchers} from "~/components/SearchResult/ResultResearchers";
import {ShimmerPublication} from "~/components/Shimmer/ShimmerPublication";
import {ShimmerResearcher} from "~/components/Shimmer/ShimmerResearcher";
import dynamic from "next/dynamic";
import {BC_BAR_COLOR} from "~/styles/global";
import {useRouter} from "next/router";
import {Loader} from "lucide-react";

const OrgChartComponent = dynamic(
  () =>
    import("~/components/OrgChartComponent").then(
      (mod) => mod.OrgChartComponent
    ),
  { ssr: false }
);

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const res = await read(
    `MATCH (n:FieldOfStudy) WHERE elementId(n)<>"${env.FOS_ROOT_ID}" RETURN elementId(n) as id 
    LIMIT 10`
  );

  const paths = res.map((x) => ({
    params: { id: encodeURIComponent(x.id as string) },
  }));

  return {
    fallback: "blocking",
    paths,
  };
};

// Function to create a map with modified IDs and their original indices
function createIdMapWithIndex(inputArray: DataType[]) {
  // Initialize an empty Map to store IDs and their modified versions
  let idMap = new Map();

  // Iterate over the array and construct the map
  inputArray.forEach((obj, index) => {
    // Create a new ID by combining the original ID and its index
    let newId = `${obj.id}_${index}`;

    // If the original ID is not in the map, add it with a new array containing the new ID
    if (!idMap.has(obj.id)) {
      idMap.set(obj.id, [newId]);
    } else {
      // If the original ID is already in the map, push the new ID to the existing array
      idMap.get(obj.id).push(newId);
    }

    // Update the object's ID with the new ID
    obj.id = newId;
  });

  // Return the created ID map
  return idMap;
}

// Function to fill parent IDs based on the created ID map
function fillParentIds(inputArray: DataType[], idMap: any) {
  // Iterate over each object in the input array
  inputArray.forEach((obj) => {
    // Retrieve the list of modified parent IDs from the ID map
    const parentIds = idMap.get(obj.parentId);

    // If the parent IDs exist
    if (parentIds) {
      // Iterate over each parent ID
      parentIds.forEach((parentId: any) => {
        // Check if there is no object with the same parent ID and original ID prefix
        if (
          !inputArray.find(
            (ele) =>
              ele.parentId === parentId &&
              ele.id.split("_")[0] === obj.id.split("_")[0]
          )
        ) {
          // Update the object's parent ID
          obj.parentId = parentId;
          return; // Exit the loop after updating the parent ID
        }
      });
    }
  });
}

// Make this statically generated (Keywords: Static Site Generation)
export const getStaticProps = async (context: GetStaticPropsContext) => {
  //////////////////////////////////////////////////////
  // Note: the following lines share the same code as [id].tsx
  // But because of nextjs magic, we can't extract this into a function
  const rootId = env.FOS_ROOT_ID;

  const rootCypher = `MATCH (root:FieldOfStudy)
  WHERE elementId(root)="${rootId}"
  RETURN root`;

  const treeCypher = `MATCH p=((root:FieldOfStudy)-[:SUPERFIELD_OF *1..]->(f:FieldOfStudy))
  where elementId(root)="${rootId}"
  return f as field, elementId(startNode(last(relationships(p)))) as parentId`;

  const rootResult = (await read(rootCypher)).map((entry) => {
    const field = entry.root as FieldWithParent;
    field.parentId = "";
    return field;
  });

  const treeResult = (await read(treeCypher)).map((entry) => {
    const field = entry.field as FieldWithParent;
    field.parentId = entry.parentId as string;
    return field;
  });

  const allFields = treeResult.concat(rootResult).map((field) => {
    return {
      id: field.elementId,
      parentId: field.parentId,
      synonyms: field.properties.synonyms,
      numberOfPublications: field.properties.numberOfPublications,
      description: field.properties.description,
      label: field.properties.label,
    } as DataType;
  });

  //////////////////////////////////////////////////////

  const { params } = context;
  const id = (params?.id as string) || "";

  fillParentIds(allFields, createIdMapWithIndex(allFields));

  const fieldCypher = `MATCH (f:FieldOfStudy)
  WHERE elementId(f)=$id
  RETURN f as field`;

  const field = (await read(fieldCypher, { id: id })).map((entry) => {
    return entry.field as Field;
  })[0]!;

  const fieldJSON = JSON.stringify(field) || "";

  if (id === env.FOS_ROOT_ID)
    return {
      props: {
        isRoot: true,
        result: JSON.stringify(allFields) || "",
      },
    } as const;
  else
    return {
      props: {
        isRoot: false,
        result: JSON.stringify(allFields) || "",
        fieldJSON: fieldJSON,
      },
      revalidate: 604800, // check if new data every 1 week
    } as const;
};

export default function FieldOfStudyView(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const router = useRouter();
  const { fieldId } = router.query;
  if (props.isRoot) {
    return <RootPage {...props} />;
  } else {
    if (fieldId && typeof fieldId === "string")
      return <FOSPage {...props} fieldId={fieldId} />;
    else return <FOSPage {...props} />;
  }
}

const RootPage = ({
  result,
}: Extract<
  InferGetStaticPropsType<typeof getStaticProps>,
  { isRoot: true }
>) => {
  if (!result) {
    return <div>No result</div>;
  }

  const fields = JSON.parse(result as string) as DataType[];

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="h-[80vh] w-[85%] flex-col items-center bg-white"
        id="hierarchyGraph"
      >
        <h1 className="mb-2 mt-2 text-center text-2xl">
          Fields of Study Hierarchy Graph
        </h1>
        <div className="mb-5 h-full rounded-xl border-2 border-black">
          <OrgChartComponent fields={fields} />
        </div>
      </div>
    </div>
  );
};

const FOSPage = ({
  result,
  fieldId,
  fieldJSON,
}: Extract<
  InferGetStaticPropsType<typeof getStaticProps>,
  { isRoot: false }
> & { fieldId?: string }) => {
  if (!result) {
    console.error("Contact maintainer");
    return <div>No result</div>;
  }

  const [page, setPage] = useState(0);
  const router = useRouter();
  const fields = useRef<DataType[]>(JSON.parse(result as string) as DataType[]);

  let field;
  try {
    field = useRef<Field>(JSON.parse(fieldJSON as string) as Field);
  } catch (error) {
    console.error("Error parsing filedJSON: ", error);
    field = useRef({});
  }

  useEffect(() => {
    setPage(0);
  }, [router.query]);

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
    survey: undefined,
  });

  const { data: allVenueData } = api.search.all_venues.useQuery();
  const { data: allFieldData } = api.search.all_fields.useQuery();

  const { data, isLoading } = api.page.field.useQuery({
    id: field.current.elementId,
    page,
    publicationSortOption: publicationSortOption,
    fieldFilters: filterData.fields,
    min_citation_filter: filterData.citation,
    min_date_filter: filterData.startYear,
    max_date_filter: filterData.endYear,
    venue_filters: filterData.venues,
    survey_filter: filterData.survey,
  });

  const { data: researcherData, isLoading: researcherIsLoading } =
    api.page.fieldAuthors.useQuery({
      id: field.current.elementId,
      researcherSortOption: researcherSortOption,
    });

  const { data: fieldData, isLoading: fieldIsLoading } =
    api.page.highlightedField.useQuery({ id: field.current.elementId });

  return (
    <div className="md:py-8">
      <div className="flex min-h-[60vh] flex-col gap-x-12 gap-y-4 p-4 md:flex-row md:px-12">
        <div className="min-w-60% space-y-3 px-5 md:w-[60%]">
          <h3>Field of Study:</h3>
          <div className="flex w-fit gap-1">
            {field.current &&
              field.current.properties &&
              field.current.properties.label && (
                <h1 className="text-2xl">{field.current.properties.label}</h1>
              )}
            <div className="hidden group-hover:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </div>
          </div>
          {field.current &&
            field.current.properties &&
            field.current.properties.description && (
              <p>{field.current.properties.description}</p>
            )}
          {field.current &&
              field.current.properties &&
              field.current.properties.synonyms &&
              field.current.properties.synonyms !== undefined && (
              <>
                <h3 className="font-medium">Synonyms:</h3>
                <em><p>{field.current.properties.synonyms.join(", ")}</p></em>
              </>
              )}

          <div className="flex w-full flex-col items-center">
            <p className="mb-6 mt-8">
              Papers published in this field over the years:
            </p>
            <div className="h-[30vh] w-[100%]">
              <ResponsiveContainer width="100%" height="110%">
                <BarChart
                  data={
                    fieldIsLoading || !fieldData?.trend ? [] : fieldData.trend
                  }
                  maxBarSize={30}
                >
                  <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar type="monotone" dataKey="count" fill={BC_BAR_COLOR} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div
          className="my-4 flex flex-col justify-start bg-white md:w-[50%]"
          id="hierarchyGraph"
        >
          <h4 className="w-full text-center text-xl">Hierarchy</h4>
          {fieldIsLoading ? (
            <div className="flex h-full items-center justify-center">
              <span>Loading...</span>
              <Loader className="animate-spin" />
            </div>
          ) : fieldId ? (
              <div className="flex h-full min-h-[50vh] w-full flex-shrink flex-grow rounded-xl border-2 border-black">
              <OrgChartComponent fields={fields.current} fieldId={fieldId} />
            </div>
          ) : (
              <div className="flex h-full min-h-[50vh] w-full flex-shrink flex-grow rounded-xl border-2 border-black">
              <OrgChartComponent fields={fields.current} />
            </div>
          )}
        </div>
      </div>
      <div className="divider md:px-12" />

      {/* Papers & Researchers */}
      <div className="mt-8 flex w-full justify-center gap-x-12 gap-y-4 p-4 md:flex-row md:px-12">
        <div className="w-[17%] border-r p-4">
          <FilterBoard
            venues={allVenueData?.venues}
            fields={allFieldData?.fields}
            setFilterData={setFilterData}
          />
        </div>

        {/* Result Publications */}
        <div className="px-[5%] md:w-[66%]">
          {field.current &&
            field.current.properties &&
            field.current.properties.label && (
              <h3 className="text-sm text-gray-400">
                <span>Publications for {field.current.properties.label}</span>
              </h3>
            )}
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
                <option value="influential">Most Influential papers</option>
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
            currentPage={page}
            setCurrentPage={setPage}
            hasNext={data?.hasNext ?? false}
            hasPrevious={data?.hasPrevious ?? false}
            totalResults={data?.total ?? 0}
          />
        </div>

        {/* Researchers */}
        {(researcherIsLoading ||
          (researcherData?.researchers &&
            !!researcherData.researchers.length)) && (
          <>
            <div className="w-[17%] space-y-3">
              {field.current &&
                field.current.properties &&
                field.current.properties.label && (
                  <h3 className="text-sm text-gray-400">
                    <span>
                      Researchers for {field.current.properties.label}
                    </span>
                  </h3>
                )}
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

              {researcherIsLoading ? (
                <div>
                  <ShimmerResearcher />
                  <ShimmerResearcher />
                  <ShimmerResearcher />
                  <ShimmerResearcher />
                </div>
              ) : !researcherData ? (
                <div>data is empty</div>
              ) : (
                <ResultResearchers researchers={researcherData.researchers} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
