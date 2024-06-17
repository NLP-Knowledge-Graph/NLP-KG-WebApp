import type {GetStaticPaths, GetStaticProps, InferGetStaticPropsType,} from "next";
import Link from "next/link";
import {useEffect, useState} from "react";
import ModifyBookmarkModal from "~/components/Common/ModifyBookmarkModal";
import {env} from "~/env.cjs";
import {useActiveSection} from "~/hooks";
import {read} from "~/server/services/neo4jConnection";
import {getMonthName, twoDigits} from "~/utils";
import {api} from "~/utils/api";
import type {DataType, FieldWithParent, PublicationSearch,} from "~/utils/types";
import AskThisPaperPopUp from "~/components/PublicationChat/AskThisPaperPopUp";
import {useSession} from "next-auth/react";
import {InlineResearcherList} from "~/components/InlineResearcherList";
import {Pagination, PaginationButton} from "~/components/Pagination";
import {PublicationField, ResultPublications,} from "~/components/SearchResult/ResultPublications";
import {ShimmerPublication} from "~/components/Shimmer/ShimmerPublication";
import {URLLink} from "~/components/URLLink";
import dynamic from "next/dynamic";

const OrgChartComponent = dynamic(
  () =>
    import("~/components/OrgChartComponent").then(
      (mod) => mod.OrgChartComponent
    ),
  { ssr: false }
);

export const getStaticPaths: GetStaticPaths<{ id: string }> = async () => {
  const res = await read(
      `MATCH (n:Publication) RETURN elementId(n) as id LIMIT 10`
  );
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
  const full_id = (params?.id as string) || "";
  var id = undefined;
  var chatid = undefined;
  if (full_id.includes("---")) {
    [id, chatid] = full_id.split("---");
  } else {
    id = full_id;
    chatid = "";
  }

  const queryString = `
    MATCH (p:Publication)
    WHERE elementId(p)='${id}'
    WITH p
    LIMIT 1
    MATCH (p)-[:PUBLISHED_AT]-(venue)
    MATCH (p)-[:HAS_FIELD_OF_STUDY]->(f:FieldOfStudy)
    WITH p AS publication, venue, collect(f) as fields
    RETURN publication, venue, fields
    `;
  const query = (await read(queryString)).map((x) => {
    x.publication.venue = x.venue;
    x.publication.fields = x.fields;
    const publication = x.publication as PublicationSearch;
    return publication;
  });

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

  fillParentIds(allFields, createIdMapWithIndex(allFields));

  const treeFieldsJSON = JSON.stringify(allFields) || "";

  const publicationJSON = JSON.stringify(query[0]) || "";

  return {
    props: {
      id,
      chatid,
      publicationJSON: publicationJSON,
      treeFieldsJSON: treeFieldsJSON,
    },
    revalidate: 604800, // check if new data every 1 week
  };
};

export default function PublicationView({
  id,
  chatid,
  publicationJSON,
  treeFieldsJSON,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { activeId } = useActiveSection(["citations", "references"]);
  const [citationsPage, setCitationsPage] = useState(0);
  const [referencesPage, setReferencesPage] = useState(0);

  const [chatMessages, setChatMessages] = useState<
      { sender: string; text: string }[]
  >([]);
  const initialRecommendedQuestions = [
    "What is the goal of this paper?",
    "What are the key results of this paper?",
    "What methods are used in this paper?",
  ];
  const [chatRecommendedQuestions, setChatRecommendedQuestions] = useState(
      initialRecommendedQuestions
  );

  useEffect(() => {
    setCitationsPage(0);
    setReferencesPage(0);
    // Reset chat messages when publication view changes
    setChatMessages([]);
    // Update recommended questions when publication view changes
    setChatRecommendedQuestions(initialRecommendedQuestions);
  }, [id]);

  if (!publicationJSON || !treeFieldsJSON) {
    return <div>No result</div>;
  }

  const publication = JSON.parse(
    publicationJSON as string
  ) as PublicationSearch;

  const content = publication.properties.fullText
    ? publication.properties.fullText
    : publication.properties.publicationTitle;
  const publicationName = publication.properties.publicationTitle;
  const publicationId = publication.elementId;

  const treeFields = JSON.parse(treeFieldsJSON as string) as DataType[];

  type SortOption = "citation" | "recency";
  const [citationsSortOption, setCitationsSortOption] =
    useState<SortOption>("citation");

  const [referencesSortOption, setReferencesSortOption] =
    useState<SortOption>("citation");

  const { data: citationsData, isLoading: citationsIsLoading } =
    api.page.publicationCitations.useQuery({
      id: publication.elementId,
      citationsPage,
      citationsSortOption: citationsSortOption,
    });

  const { data: referencesData, isLoading: referencesIsLoading } =
    api.page.publicationReferences.useQuery({
      id: publication.elementId,
      referencesPage,
      referencesSortOption: referencesSortOption,
    });

  const { data: session } = useSession();
  const { data: profileData } = api.profile.get.useQuery(undefined, {
    enabled: session !== undefined && session !== null,
  });

  return (
    <div className="md:py-8">
      {/* Upper part */}
      <div className="flex min-h-[50vh] flex-col gap-x-12 gap-y-4 overflow-x-hidden p-4 md:flex-row md:px-12">
        {/* Left */}
        <div className="md:w-2/3 md:pl-12">
          <div className="">
            <h3>Publication:</h3>
            <h1 className="flex flex-row items-start justify-between text-2xl font-semibold">
              <div>{publication.properties.publicationTitle}</div>
              <ModifyBookmarkModal publication={publication.elementId} />
            </h1>
            <div className="my-2 space-y-3">
              <p className="text-sm">
                <InlineResearcherList
                  authorList={publication.properties.authorList}
                  authorIdList={publication.properties.authorIdList}
                />
                &nbsp;•&nbsp;
                <Link
                  href={`/venues/${encodeURIComponent(
                    publication.venue.elementId
                  )}`}
                  className="link"
                  key={publication.venue.elementId}
                >
                  @{publication.venue.properties.name}
                </Link>
                &nbsp;•&nbsp;
                <span>{`${twoDigits(
                  publication.properties.publicationDate.day
                )} ${getMonthName(
                  publication.properties.publicationDate.month
                )} ${publication.properties.publicationDate.year}`}</span>
              </p>
              <p className="mb-2">
                <b>TLDR:</b> {publication.properties.tldr}
              </p>
              <div className="flex space-x-2">
                <URLLink publication={publication} />
                <div className="rounded-full border-2 px-2 text-center text-sm font-semibold">
                  Citations: {publication.properties.numberOfCitations}
                </div>
              </div>
            </div>
          </div>

          <div className="block peer-checked:hidden">
            <div className="divider divider-vertical m-0" />
            <b>Abstract:</b> {publication.properties.publicationAbstract}
          </div>
          <div className="my-3 space-x-2 space-y-3">
            {publication.fields.map((field) => {
              return (
                <PublicationField
                  key={`${publication.elementId}-${field.elementId}`}
                  {...field}
                />
              );
            })}
          </div>
        </div>
        {/* Right */}
        <div
            className="mt-4 flex flex-col justify-start bg-white md:w-[50%]"
            id="hierarchyGraph"
        >
          <h2 className="mb-6 text-center text-lg font-semibold">
            Related Fields of Study
          </h2>

          {citationsIsLoading ? (
            <div>loading</div>
          ) : !citationsData ? (
            <div>No Result</div>
          ) : (
              <div className="flex h-[50vh] flex-shrink flex-grow rounded-xl border-2 border-black md:min-h-[50vh]">
                <OrgChartComponent
                    fields={treeFields}
                    publicationFields={publication.fields}
                />
            </div>
          )}
        </div>
      </div>

      {/* Lower Part */}
      <div className="sticky flex h-16 justify-center gap-8 border-y-4 bg-white">
        <Link
          className={`flex h-full items-center p-4 font-bold hover:bg-gray-200 ${
            activeId === "citations" ? "bg-gray-100" : ""
          }`}
          href="#citations"
        >
          {publication.properties.numberOfCitations || "No"}
          &nbsp;Citations
        </Link>
        <Link
          className={`flex h-full items-center p-4 font-bold hover:bg-gray-200 ${
            activeId === "references" ? "bg-gray-100" : ""
          }`}
          href="#references"
        >
          {referencesData ? referencesData.total : "No"}
          &nbsp;References
        </Link>
      </div>
      <div className="p-4 md:px-24">
        <div
          id="citations"
          className="m-auto w-[70vw] scroll-mt-28 xl:w-[800px]"
        >
          <h3 className="text-xl font-semibold">Citations</h3>
          <div className="mb-3 flex justify-between">
            {(citationsIsLoading || !!citationsData?.citations.length) && (
              <div className="flex items-center">
                <span className="mr-2 text-xs text-gray-400">Sort by</span>
                <select
                  onChange={(e) =>
                    setCitationsSortOption(e.target.value as SortOption)
                  }
                  value={citationsSortOption}
                  className="select select-bordered select-primary select-xs text-primary"
                >
                  <option value="citation">Citation</option>
                  <option value="recency">Recency</option>
                </select>
              </div>
            )}
            <PaginationButton
              currentPage={citationsPage}
              setCurrentPage={setCitationsPage}
              hasNext={citationsData?.hasNext ?? false}
              hasPrevious={citationsData?.hasPrevious ?? false}
            />
          </div>
          {citationsIsLoading ? (
            <>
              <ShimmerPublication />
              <ShimmerPublication />
              <ShimmerPublication />
              <ShimmerPublication />
            </>
          ) : !citationsData ? (
            <div>data is empty</div>
          ) : (
            <ResultPublications publications={citationsData.citations} />
          )}
          <Pagination
            totalResults={citationsData?.total ?? 0}
            currentPage={citationsPage}
            setCurrentPage={setCitationsPage}
            hasNext={citationsData?.hasNext ?? false}
            hasPrevious={citationsData?.hasPrevious ?? false}
          />
        </div>
        <div className="divider" />
        <div
          id="references"
          className="m-auto w-[70vw] scroll-mt-28 xl:w-[800px]"
        >
          <h3 className="text-xl font-semibold">References</h3>
          <div className="mb-3 flex justify-between">
            {(referencesIsLoading || !!referencesData?.references.length) && (
              <div className="flex items-center">
                <span className="mr-2 text-xs text-gray-400">Sort by</span>
                <select
                  onChange={(e) =>
                    setReferencesSortOption(e.target.value as SortOption)
                  }
                  value={referencesSortOption}
                  className="select select-bordered select-primary select-xs text-primary"
                >
                  <option value="citation">Citation</option>
                  <option value="recency">Recency</option>
                </select>
              </div>
            )}

            <PaginationButton
              currentPage={referencesPage}
              setCurrentPage={setReferencesPage}
              hasNext={referencesData?.hasNext ?? false}
              hasPrevious={referencesData?.hasPrevious ?? false}
            />
          </div>
          {referencesIsLoading ? (
            <>
              <ShimmerPublication />
              <ShimmerPublication />
              <ShimmerPublication />
              <ShimmerPublication />
            </>
          ) : !referencesData ? (
            <div>data is empty</div>
          ) : (
            <ResultPublications publications={referencesData.references} />
          )}
          <Pagination
            totalResults={referencesData?.total ?? 0}
            currentPage={referencesPage}
            setCurrentPage={setReferencesPage}
            hasNext={referencesData?.hasNext ?? false}
            hasPrevious={referencesData?.hasPrevious ?? false}
          />
        </div>

        <div key={publicationId} className="ml-2 w-[12%] border-r p-4">
          <AskThisPaperPopUp
            publication={content}
            publicationId={publicationId}
            publicationName={publicationName}
            chatId={chatid}
            openaikey={profileData?.openaikey}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatRecommendedQuestions={chatRecommendedQuestions}
            setChatRecommendedQuestions={setChatRecommendedQuestions}
          />
        </div>
      </div>
    </div>
  );
}