import {type MutableRefObject, useEffect, useRef} from "react";
import type {FieldSearch} from "~/utils/types";
import {useDraggable, useRect} from "~/hooks";
import Link from "next/link";

type ResultFieldsProps = {
  fields: FieldSearch[];
  toggleFilter: (field: FieldSearch) => void;
  fieldFilters: FieldSearch[];
};

export const ResultFields = (props: ResultFieldsProps) => {
  const { fields, toggleFilter, fieldFilters } = props;

  const containerRef =
    useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  const scrollRef =
    useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  const { events } = useDraggable(containerRef); // Now we pass the reference to the useDraggable hook:

  const leftArrowRef =
    useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  const rightArrowRef =
    useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  const [firstItemRect, firstItemRef] = useRect<HTMLDivElement>();
  const [lastItemRect, lastItemRef] = useRect<HTMLDivElement>();

  const handleClickScrollLeft = () => {
    containerRef.current.scrollBy({
      left: -window.innerWidth / 2,
      behavior: "smooth",
    });
  };

  const handleClickScrollRight = () => {
    containerRef.current.scrollBy({
      left: window.innerWidth / 2,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (firstItemRect && firstItemRect?.left < 0) {
      leftArrowRef.current?.classList.remove("hidden");
    } else {
      leftArrowRef.current?.classList.add("hidden");
    }
  }, [firstItemRect]);

  useEffect(() => {
    if (lastItemRect && lastItemRect?.right > window.innerWidth) {
      rightArrowRef.current?.classList.remove("hidden");
    } else {
      rightArrowRef.current?.classList.add("hidden");
    }
  }, [lastItemRect]);

  const hasOverflow = () => {
    return scrollRef.current?.scrollWidth > document.body.offsetWidth;
  };

  if (fields.length === 0) {
    return <div {...events} ref={containerRef} />;
  }

  type FieldBoxProps = {
    field: FieldSearch;
    reference?: MutableRefObject<HTMLDivElement | null>;
  };

  const FieldBox = ({ field, reference }: FieldBoxProps) => {
    return (
      <div
        className={`flex select-none flex-row rounded-xl border-2
        [&>*]:h-full [&>*]:items-center [&>*]:px-2 [&>*]:py-1 [&>*]:text-center [&>*]:align-middle
        ${
          fieldFilters.includes(field)
            ? "bg-primary text-white"
            : "[&>*:hover]:bg-gray-50"
        }`}
        key={field.elementId}
        ref={reference}
      >
        <div
          className="tooltip tooltip-right border-r-2 text-xs"
          data-tip={`Number of publications in this Field of Study`}
        >
          <div className="flex h-full w-full items-center">
            <div className="flex flex-row gap-1">
              <span>{field.properties.numberOfPublications}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                width="10"
                height="10"
                viewBox="0 0 24 24"
              >
                <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
              </svg>
            </div>
          </div>
        </div>

        <Link
          href={`/fields/${encodeURIComponent(field.elementId)}`}
          data-tip={`Go to Field of Study page`}
          className="tooltip tooltip-right whitespace-nowrap border-r-2 text-sm hover:underline "
        >
          {field.properties.label}
        </Link>
        <div
          onClick={() => toggleFilter(field)}
          className="flex cursor-pointer text-xs"
        >
          {fieldFilters.includes(field) ? (
            <div
              className="tooltip tooltip-right flex"
              data-tip="Remove Field of Study filter from search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 group-hover:text-black"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <div
              className="tooltip tooltip-right flex"
              data-tip="Add Field of Study filter to search"
            >
              <svg
                fill="none"
                height="24"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                  strokeWidth="1.5"
                >
                  <path d="m21.63 14.75c0 .89-.25 1.73-.69 2.45-.82 1.38-2.33 2.3-4.06 2.3s-3.24-.93-4.06-2.3c-.44-.71-.69-1.56-.69-2.45 0-2.62 2.13-4.75 4.75-4.75s4.75 2.13 4.75 4.75z" />
                  <path d="m18.66 14.73h-3.55" />
                  <path d="m16.88 13v3.55" />
                  <path d="m20.6901 4.02002v2.21997c0 .81-.51 1.82002-1.01 2.33002l-1.76 1.54999c-.33-.08-.68-.12-1.04-.12-2.62 0-4.75 2.13-4.75 4.75 0 .89.25 1.73.69 2.45.37.62.88 1.15 1.5 1.53v.34c0 .61-.4 1.42-.91 1.72l-1.41.91c-1.31.81-3.13004-.1-3.13004-1.72v-5.35c0-.71-.41-1.62-.81-2.12l-3.84-4.04003c-.5-.51-.91-1.41996-.91-2.01996v-2.33001c0-1.21.91-2.12 2.02-2.12h13.34004c1.11 0 2.02.91002 2.02 2.02002z" />
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        tabIndex={0}
        className={`h-[52px] w-screen overflow-hidden pb-[15px] ${
          hasOverflow() ? "hover:overflow-x-auto hover:pb-0" : ""
        }`}
        {...events}
        ref={containerRef} // add reference and events to the wrapping div
      >
        <div
          ref={scrollRef}
          className={`ml-4 md:ml-48 mr-0 flex w-fit flex-nowrap space-x-4 pr-0 ${
            hasOverflow() ? "pr-28" : ""
          }`}
        >
          {fields[0] && <FieldBox field={fields[0]} reference={firstItemRef} />}
          {fields.slice(1, -1).map((field) => {
            return <FieldBox field={field} key={field.elementId} />;
          })}
          {fields.length > 1 && fields[fields.length - 1] && (
            <FieldBox
              field={fields[fields.length - 1] as FieldSearch}
              reference={lastItemRef}
            />
          )}
        </div>
      </div>
      <div
        ref={rightArrowRef}
        className={`absolute right-12 top-0 z-10 flex h-12 w-12 cursor-pointer items-center
         justify-center rounded-full bg-gray-600 text-gray-400 hover:text-white ${
           !hasOverflow() ? "hidden" : ""
         }`}
        onClick={handleClickScrollRight}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={4}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </div>
      <div
        ref={leftArrowRef}
        className={`absolute left-12 top-0 z-10 flex h-12 w-12 cursor-pointer items-center 
        justify-center rounded-full bg-gray-600 text-gray-400 hover:text-white ${
          !hasOverflow() ? "hidden" : ""
        }`}
        onClick={handleClickScrollLeft}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={4}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
          />
        </svg>
      </div>
    </div>
  );
};
