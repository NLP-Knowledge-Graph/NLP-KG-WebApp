import Link from "next/link";
import { getMonthName, twoDigits } from "~/utils";
import type { Field, PublicationSearch } from "~/utils/types";
import { InlineResearcherList } from "../InlineResearcherList";
import { URLLink } from "../URLLink";
import ModifyBookmarkModal from "../Common/ModifyBookmarkModal";

type ResultPublicationsProps = {
  publications: PublicationSearch[];
};

export const ResultPublications = ({
  publications,
}: ResultPublicationsProps) => {
  if (publications.length === 0) {
    return <div></div>;
  }

  return (
    <ul className="flex flex-col space-y-7">
      {publications.map((publication) => {
        return (
          <ResultPublication key={publication.elementId} {...publication} />
        );
      })}
    </ul>
  );
};

const ResultPublication = (publication: PublicationSearch) => {
  return (
    <li className="max-w-[800px] space-y-1">
      <div className="flex flex-row items-start justify-between ">
        <Link
          href={`/publications/${encodeURIComponent(publication.elementId)}`}
          className="link-hover link tooltip text-left text-xl text-primary"
          data-tip={`Go to publication: ${publication.properties.publicationTitle}`}
        >
          {publication.properties.publicationTitle}
        </Link>
        <ModifyBookmarkModal publication={publication.elementId} />
      </div>
      <p className="text-sm">
        <InlineResearcherList
          authorList={publication.properties.authorList}
          authorIdList={publication.properties.authorIdList}
        />
        &nbsp;•&nbsp;
        <Link
          href={`/venues/${encodeURIComponent(publication.venue.elementId)}`}
          className="link tooltip"
          key={publication.venue.elementId}
          data-tip={`Go to venue: ${publication.venue.properties.name}`}
        >
          @{publication.venue.properties.name}
        </Link>
        &nbsp;•&nbsp;
        <span>{`${twoDigits(
          publication.properties.publicationDate.day
        )} ${getMonthName(publication.properties.publicationDate.month)} ${
          publication.properties.publicationDate.year
        }`}</span>
      </p>

      <p className="text-sm">TLDR: {publication.properties.tldr}</p>
      <label>
        <input type="checkbox" name="abstract" className="peer hidden" />
        <div className="block cursor-pointer text-sm text-primary peer-checked:hidden">
          Show Abstract
        </div>
        <div className="hidden text-sm peer-checked:block">
          <div className="divider divider-vertical m-0" />
          Abstract: {publication.properties.publicationAbstract}
          <p className="cursor-pointer text-primary">Hide Abstract</p>
        </div>
      </label>

      <div className="flex flex-row flex-wrap items-center space-y-1 [&>*]:mr-2">
        <div
          className="tooltip flex gap-1 rounded-full bg-primary px-2 py-1"
          data-tip={"Number of citations"}
        >
          <span className=" flex text-center text-sm text-white">
            {publication.properties.numberOfCitations.toLocaleString()}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
            width="10"
            height="10"
            viewBox="0 0 24 24"
          >
            <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
          </svg>
        </div>
        <URLLink publication={publication} />

        {publication.fields.map((field) => {
          return (
            <PublicationField
              key={`${publication.elementId}-${field.elementId}`}
              {...field}
            />
          );
        })}
      </div>
    </li>
  );
};

export const PublicationField = (field: Field) => {
  return (
    /**
     * TODO: Change back to Link?
     */
    <a
      href={`/fields/${encodeURIComponent(field.elementId)}`}
      className="btn-xs tooltip rounded-xl border-2 text-gray-400 hover:text-black hover:underline focus:border-black focus:text-black"
      data-tip={`Go to Field of Study: ${field.properties.label}`}
    >
      {field.properties.label}
    </a>
  );
};
