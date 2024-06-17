import React, { useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { DataType } from "~/utils";
import Draggable from "react-draggable";
import { useRouter } from "next/router";
import getConfig from "next/config";
import { api } from "~/utils/api";
import { ArrowDownIcon, ArrowUpIcon, EqualIcon, Loader } from "lucide-react";

interface Props {
  handleClose: () => void;
  fos: DataType;
}

const FOSDetailsCard: React.FC<Props> = ({ handleClose, fos }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uri = fos?.id.split("_")[0] as string;
  const router = useRouter();
  const { id } = router.query;
  const { publicRuntimeConfig } = getConfig();
  const fosRootId = publicRuntimeConfig.FOS_ROOT_ID;
  const [trend, setTrend] = useState<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose]);

  const { data: fieldData, isLoading: fieldIsLoading } =
    api.page.highlightedField.useQuery({ id: String(fos.id.split("_")[0]) });

  useEffect(() => {
    if (fieldData && fieldData.trend) {
      let lastYear = fieldData.trend.find((value) => {
        return value.year === new Date().getFullYear() - 1;
      });
      let preLastYear = fieldData.trend.find((value) => {
        return value.year === new Date().getFullYear() - 2;
      });
      if (lastYear && preLastYear) {
        setTrend(
          Number(((100 / preLastYear.count) * lastYear.count - 100).toFixed(2))
        );
      }
    }
  }, [fieldData]);

  return (
    <Draggable cancel=".no-drag">
      <div
        ref={containerRef}
        className="absolute left-0 top-[15%] z-[9999] m-[2rem] w-[30%] cursor-move overflow-auto rounded-xl border-2 border-black bg-[#C2D7EF] p-[2rem]"
        style={{ height: "auto" }}
      >
        <button
          className="absolute right-[10px] top-[10px] flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-2 border-black bg-[#C2D7EF] text-black hover:bg-primary hover:text-white"
          onClick={handleClose}
        >
          <MdClose />
        </button>
        {fos && (
          <div className="no-drag cursor-default rounded-xl bg-[#C2D7EF]">
            <p className="mb-7 cursor-text text-center text-[20px] font-bold">
              {fos.label}
            </p>
            <p className="mb-2  cursor-text">{fos.description}</p>
            <div className="mb-2 flex cursor-text flex-row">
              <p className="">
                <strong>Number of Publications: </strong>
                {Number(fos.numberOfPublications) >= 20 ? (
                  <span>
                    {Number(fos.numberOfPublications).toLocaleString("es-US")}
                  </span>
                ) : (
                  <span className="text-red-500">
                    {Number(fos.numberOfPublications).toLocaleString("en-US")}
                  </span>
                )}
              </p>
              {fieldIsLoading ? (
                <div
                  className="tooltip ml-2 flex items-center"
                  data-tip={`Trend from ${new Date().getFullYear() - 2} to ${
                    new Date().getFullYear() - 1
                  }`}
                >
                  <Loader className="animate-spin" />
                </div>
              ) : trend > 0 ? (
                <div
                  className="tooltip ml-2 flex items-center text-green-500"
                  data-tip={`Trend from ${new Date().getFullYear() - 2} to ${
                    new Date().getFullYear() - 1
                  }`}
                >
                  <ArrowUpIcon />
                  <p className="ml-1">{trend}%</p>
                </div>
              ) : trend < 0 ? (
                <div
                  className="tooltip ml-2 flex items-center text-red-500"
                  data-tip={`Trend from ${new Date().getFullYear() - 2} to ${
                    new Date().getFullYear() - 1
                  }`}
                >
                  <ArrowDownIcon />
                  <p className="ml-1">{trend}%</p>
                </div>
              ) : (
                <div
                  className="tooltip ml-2 flex items-center text-gray-500"
                  data-tip={`Trend from ${new Date().getFullYear() - 2} to ${
                    new Date().getFullYear() - 1
                  }`}
                >
                  <EqualIcon className="h-4 w-4" />
                  <p className="ml-1">{trend}%</p>
                </div>
              )}
            </div>

            {fos.synonyms && (
              <p className="mb-7 cursor-text">
                <strong>Synonyms: </strong> {fos.synonyms.join(", ")}
              </p>
            )}

            {fos.label !== "Natural Language Processing" ? (
              <a
                href={`/fields/${encodeURIComponent(uri)}${
                  fos.id ? `?fieldId=${encodeURIComponent(fos.id)}` : ""
                }`}
                className="tooltip rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                data-tip={`Go to field: ${fos.label}`}
              >
                {`${fos.label}`}
              </a>
            ) : id !== fosRootId ? (
              <a
                href={`/fields/${encodeURIComponent(uri)}${
                  fos.id ? `?fieldId=${encodeURIComponent(fos.id)}` : ""
                }`}
                className="tooltip rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                data-tip={`Go to field: ${fos.label}`}
              >
                {`${fos.label}`}
              </a>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default FOSDetailsCard;
