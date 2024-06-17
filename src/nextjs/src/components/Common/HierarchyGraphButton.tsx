// components/HierarchyButton.js
import { useRouter } from "next/router";

const HierarchyButton = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/rootFoS");
  };

  return (
    <button
      className="btn btn-sm tooltip tooltip-bottom"
      onClick={handleClick}
      data-tip="Go to Fields of Study hierarchy graph"
    >
      <div className="flex flex-row items-center gap-x-2">
        <span>Hierarchy Graph</span>
      </div>
    </button>
  );
};

export default HierarchyButton;
