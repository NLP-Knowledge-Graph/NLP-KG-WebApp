import React from "react";

const CustomNodeContent = (props: any) => {
  const url = props.data.id.split("_")[0] as string;
  const currentPath = window.location.pathname;
  const currentPathId = decodeURIComponent(
    currentPath.substring(currentPath.lastIndexOf("/") + 1)
  );
  const backgroundColor = currentPathId === url ? "bg-[#9ABCE4]" : "bg-white";

  return (
    <a
      className={`flex h-full w-full rounded-xl border-2 border-black px-1 py-1 hover:bg-blue-800 hover:text-white ${backgroundColor}`}
    >
      <div className="m-auto flex text-center">
        <div className="text-base">{props.data.label}</div>
      </div>
    </a>
  );
};

export default CustomNodeContent;
