import Link from "next/link";
import {useEffect, useState} from "react";
import type {PublicationSearch} from "~/utils/types";

type URLLinkProps = {
  publication: PublicationSearch;
};

export const URLLink = ({ publication }: URLLinkProps) => {
  const [selectedLink, setSelectedLink] = useState<string>("");
  const [options, setOptions] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const newOptions: { name: string; url: string }[] = [];

    if (publication.properties.doi) {
      newOptions.push({
        name: "DOI",
        url: `https://doi.org/${publication.properties.doi}`,
      });
    }
    if (publication.properties.arxivUrl) {
      newOptions.push({
        name: "arXiv",
        url: publication.properties.arxivUrl,
      });
    }
    if (publication.properties.aclUrl) {
      newOptions.push({
        name: "ACL",
        url: publication.properties.aclUrl,
      });
    }

    setOptions(newOptions);
    setSelectedLink(newOptions[0]?.url || "");
  }, [publication]);

  if (!selectedLink) return <></>;

  return (
    <div className="flex">
      <div className="tooltip" data-tip="Change link source">
        <select
            className="pl-2 pr-2 h-7 border-l-2 border-t-2 border-b-2 rounded-l-full hover:bg-primary group hover:text-white cursor-pointer bg-white text-center appearance-none"
            onChange={(e) => setSelectedLink(e.target.value)}
        >
          {options.map((option) => {
            return (
                <option
                    key={`${option.url}-${publication.elementId}`}
                    value={option.url}
                >
                  {option.name}
                </option>
            );
          })}
        </select>
      </div>
      <div
          className="tooltip"
          data-tip="Open link in new tab"
      >
        <Link
            target="_blank"
            href={selectedLink}
            className="py-1 flex pl-2 pr-2 border-2  rounded-r-full bg-primary group"
        >
          <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 text-white"
          >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};
