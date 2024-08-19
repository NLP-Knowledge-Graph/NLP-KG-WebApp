import React, {KeyboardEvent, useEffect, useRef, useState} from "react";
import {NodeId, OrgChart} from "@ferdydh/d3-org-chart";
import {extent, scaleSqrt, select} from "d3";
import ReactDOMServer from "react-dom/server";
import CustomExpandButton from "./CustomExpandButton";
import CustomNodeContent from "./CustomNodeContent";
import FOSDetailsCard from "./FOSDetailsCard";
import {useRouter} from "next/router";
import Select from "react-select";
import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  FullscreenIcon,
  MaximizeIcon,
  MinimizeIcon,
  RepeatIcon,
  ScalingIcon,
  SearchXIcon,
} from "lucide-react";
import Fuse from "fuse.js";

type OrgChartComponentProps = {
  fields: DataType[];
  fieldId?: string;
  publicationFields?: any[];
};

type DataType = {
  id: string;
  parentId: string;
  numberOfPublications: number;
  description: string;
  label: string;
  _directSubordinates: number;
};

const chevronUp = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
</svg>
`;

const chevronDown = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
</svg>
`;

const sortOptions = [
  {
    value: "label-ascending",
    label: "Sort by Name (A-Z)",
  },
  {
    value: "label-descending",
    label: "Sort by Name (Z-A)",
  },
  {
    value: "numberOfPublications-ascending",
    label: "Sort by Publications (Low-High)",
  },
  {
    value: "numberOfPublications-descending",
    label: "Sort by Publications (High-Low)",
  },
];

export const OrgChartComponent = ({
  fields,
  fieldId,
  publicationFields,
}: OrgChartComponentProps) => {
  const d3Container = useRef<HTMLDivElement>(null);
  const chart = useRef(new OrgChart<DataType>());
  const [cardShow, setCardShow] = useState(false);
  const [FOSID, setFOSID] = useState("");
  const [searchField, setSearchField] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [clickedNode, setClickedNode] = useState<NodeId>();
  const [fieldsData, setFieldsData] = useState(fields);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const router = useRouter();
  let compact = true;

  const fuseOptions = {
    includeScore: true,
    useExtendedSearch: true,
    threshold: 0.35,
    keys: [{ name: "label", weight: 2.5 }, "description"],
  };

  const fuseIndex = Fuse.createIndex(fuseOptions.keys, fields);

  const fuse = new Fuse(fields, fuseOptions, fuseIndex);

  //Calculations for visible node size
  const [minNodeSize, maxNodeSize] = extent(
    fields,
    (d) => d.numberOfPublications
  );
  const radiusScale = scaleSqrt()
    .domain([minNodeSize, maxNodeSize])
    .range([100, 220]);
  fields.forEach((d) => {
    d._radius = Math.round(radiusScale(d.numberOfPublications) * 10) / 10;
  });

  useEffect(() => {
    if (fields && d3Container.current) {
      chart.current
        .container(d3Container.current as unknown as string)
        .data(fieldsData)
        .compact(true)
        .enableZoom(true)
        .childrenMargin((d) => 50)
        .compactMarginBetween((d) => 25)
        .compactMarginPair((d) => 50)
        .siblingsMargin((d) => 25)
        .svgHeight(d3Container.current.offsetHeight)
        .svgWidth(d3Container.current.offsetWidth)
        /* Uncomment to show paging within the tree view
        .pagingStep((d) => 6)
        .minPagingVisibleNodes((d) => {
          if (d.depth === 0) return 14;
          return 6;
        })
        .pagingButton((d, i, arr, state) => {
          const step = state.pagingStep(d.parent);
          const currentIndex = d.parent.data._pagingStep;
          const diff = d.parent.data._directSubordinatesPaging - currentIndex;
          const min = Math.min(diff, step);
          return `
                    <div style="margin-top:50px;">
                        <div style="display:flex;width:170px;border-radius:20px;padding:5px 15px; padding-bottom:4px;;background-color:#3070B3">
                          <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5.59 7.41L10.18 12L5.59 16.59L7 18L13 12L7 6L5.59 7.41ZM16 6H18V18H16V6Z" fill="#ffffff" stroke="#ffffff"/>
                            </svg>
                          </div>
                        <div style="line-height:2; color: white"> Show next ${min}  nodes </div>
                        </div>
                    </div>
                  `;
        }) */
        .nodeUpdate(function (d, i, arr) {
          select(this)
            .select(".node-rect")
            .attr("stroke", (d) =>
              d.data._highlighted || d.data._upToTheRootHighlighted
                ? "#e37222"
                : "none"
            )
            .attr(
              "stroke-width",
              d.data._highlighted || d.data._upToTheRootHighlighted ? 7 : 1
            );
        })
        .linkUpdate(function (d, i, arr) {
          select(this)
            .attr("stroke", (d) =>
              d.data._upToTheRootHighlighted ? "#e37222" : "#000000"
            )
            .attr("stroke-width", (d) =>
              d.data._upToTheRootHighlighted ? 4 : 1.3
            );

          if (d.data._upToTheRootHighlighted) {
            select(this).raise();
          }
        })
        .onNodeClick((d) => {
          setCardShow(true);
          setFOSID(d.data.id);
          setClickedNode(d.data.id);
          chart.current.clearHighlighting();
          if (searchResults.length > 0) {
            searchResults.forEach((element) => {
              chart.current.setUpToTheRootHighlighted(element);
            });
          }
          chart.current.setUpToTheRootHighlighted(d.data.id).render();
        })
        .buttonContent((node, state) => {
          return ReactDOMServer.renderToStaticMarkup(
            <CustomExpandButton {...node.node} />
          );
        })
        .nodeContent((d, i, arr, state) => {
          return ReactDOMServer.renderToStaticMarkup(
            <CustomNodeContent {...d} />
          );
        })
        .setActiveNodeCentered(true);

      if (showSize) {
        chart.current
          .nodeHeight((d) => d.data._radius)
          .nodeWidth((d) => d.data._radius * 1.5);
      } else {
        chart.current.nodeHeight((d) => 100).nodeWidth((d) => 200);
      }

      chart.current.render().fitExact();
      if (chart.current && fieldId) {
        chart.current.clearHighlighting();
        chart.current.setUpToTheRootHighlighted(fieldId).render().fit();
      } else {
        const { id } = router.query;
        const data = chart.current.data();
        if (data && typeof id === "string") {
          data.forEach((d) => {
            if (d.id.includes(id + "_")) {
              // If matches, mark node as highlighted
              chart.current.setUpToTheRootHighlighted(d.id).render().fit();
            }
          });
        }
      }
      if (chart.current && publicationFields) {
        const data = chart.current.data();

        if (data) {
          publicationFields.forEach((pub) => {
            data.forEach((d) => {
              if (d.id.includes(pub.elementId + "_"))
                chart.current.setUpToTheRootHighlighted(d.id).render().fit();
            });
          });
          chart.current.collapseAll().initialExpandLevel(1).render().fit();
        }
      }
    }
  }, [fieldsData, d3Container.current, searchResults, showSize, sortConfig]);

  function filterChart() {
    // Get input value
    const value = searchField.trim();

    // Prepare array for saving search results
    const allSearchResults: string[] = [];

    // Clear previous higlighting
    chart.current.clearHighlighting();

    // Collapse all nodes
    chart.current.collapseAll().initialExpandLevel(1);

    // Show up to 10 results
    const searchResults = fuse.search(value, { limit: 10 });

    // Loop over data and check if input value matches any name
    if (searchResults)
      searchResults.forEach((d) => {
        // Only highlight matches with a good match
        if (d.score && d.score <= 0.3) {
          // Mark node as highlighted
          chart.current.setUpToTheRootHighlighted(d.item.id);
          // Add to search result array
          allSearchResults.push(d.item.id);
        }
      });

    setSearchResults(allSearchResults);

    // Update data and rerender graph
    chart.current.render().fit();
  }

  const sortFields = (fields, sortConfig) => {
    return [...fields].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  useEffect(() => {
    const sortedFields = sortFields(fields, sortConfig);
    setFieldsData(sortedFields);
  }, [sortConfig, d3Container.current, searchResults, showSize]);

  const handleSortChange = (selectedOption) => {
    const [key, direction] = selectedOption.value.split("-");
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    function handleResize() {
      if (chart.current && d3Container.current) {
        // Adjust chart size
        chart.current.svgHeight(d3Container.current.offsetHeight);
        chart.current.svgWidth(d3Container.current.offsetWidth);
        chart.current.render().fit();
      }
    }

    window.addEventListener("resize", handleResize);
  });

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#E3EEFA]">
      <div>
        {chart && (
          <div className="mb-2 mt-2 flex flex-row flex-wrap justify-center gap-1">
            <div className="flex flex-shrink-0 gap-x-1 self-stretch">
              <form className="flex flex-1 flex-row items-center gap-x-2 rounded-lg border border-gray-300 bg-white p-2 focus-within:border-blue-500 focus-within:ring-blue-500">
                <div className="pointer-events-none inset-y-0 left-0 flex items-center">
                  <svg
                    className="h-4 w-4 text-black"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </div>

                <input
                  type="search"
                  value={searchField}
                  onInput={(e) => setSearchField(e.currentTarget.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.preventDefault();
                    filterChart();
                  }}
                  placeholder="Search Graph"
                />
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      filterChart();
                    }}
                    className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    data-tip="Search for exact node name"
                  >
                    Search Graph
                  </button>
                </div>
              </form>
            </div>

            <div className="flex flex-shrink gap-x-1 self-stretch">
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => {
                  setSearchField("");
                  setSearchResults([]);
                  chart.current.clearHighlighting();
                  var data = chart.current.data();
                  if (data)
                    data.forEach((element) => {
                      element._expanded = false;
                    });
                  if (clickedNode)
                    chart.current.setUpToTheRootHighlighted(clickedNode);
                }}
                data-tip="Reset Search"
              >
                <SearchXIcon />
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => chart.current.render().fit()}
                data-tip="Center graph"
              >
                <FullscreenIcon />
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => {
                  if (compact) {
                    chart.current.compact(false).layout("left").render().fit();
                    compact = !compact;
                  } else {
                    chart.current.compact(true).layout("top").render().fit();
                    compact = !compact;
                  }
                }}
                data-tip="Change view"
              >
                <RepeatIcon />
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => chart.current.expandAll().render().fit()}
                data-tip="Expand all nodes"
              >
                <ChevronsUpIcon/>
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() =>
                  chart.current
                    .collapseAll()
                    .initialExpandLevel(1)
                    .render()
                    .fit()
                }
                data-tip="Collapse all nodes"
              >
                <ChevronsDownIcon/>
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => {
                  if (!isFullscreen && document.fullscreenEnabled) {
                    document
                      .querySelector("#hierarchyGraph")
                      ?.requestFullscreen();
                    //setIsFullscreen(true);
                  } else {
                    document.exitFullscreen();
                    //setIsFullscreen(false);
                  }
                  /* chart.current.fullscreen();
                  chart.current.render().fit(); */
                }}
                data-tip={
                  !isFullscreen ? "Enter Fullscreen" : "Exit Fullscreen"
                }
              >
                {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
              </button>
              <button
                className="tooltip tooltip-bottom rounded-lg bg-primary px-2 py-0 text-xs font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                onClick={() => {
                  setShowSize(!showSize);
                  chart.current.render().fit();
                }}
                data-tip={!showSize ? "Adjust node sizes according to the number of publications" : "Set all nodes to the same size"}
              >
                <ScalingIcon />
              </button>
            </div>

            <div className="flex flex-shrink gap-x-1 self-stretch">
              <div className="flex items-center">
                <Select
                  options={sortOptions}
                  onChange={handleSortChange}
                  isSearchable={false}
                  placeholder="Select Sorting Option"
                />
              </div>
            </div>

            {cardShow && (
              <FOSDetailsCard
                fos={fields.find((fos) => fos.id === FOSID)}
                handleClose={() => setCardShow(false)}
              />
            )}
          </div>
        )}
      </div>
      <div ref={d3Container} className="h-full w-full bg-[#E3EEFA]"></div>
    </div>
  );
};
