import {getToggleState} from "~/context/ToggleContext";

export const Toggle = () => {
    const { isToggled, setIsToggled } = getToggleState();
  
    const handleToggle = () => {
      setIsToggled(!isToggled);
    };

    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isToggled}
                onChange={handleToggle}
            />
            <span className="ml-2 text-left text-base" style={{ width: '130px' }}>
                {isToggled ? "Semantic Search" : "Lexical Search"}
            </span>
        </div>
    );
  };
  