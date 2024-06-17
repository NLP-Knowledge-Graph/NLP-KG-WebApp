import React from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import CSS from "csstype";

interface Styles {
  expandBtn: CSS.Properties;
}

const styles: Styles = {
  expandBtn: {
    width: "30px",
    height: "30px",
    margin: "auto",
    color: "#227c9d",
    backgroundColor: "#fef9ef",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "2px solid #d3d3d3",
    borderRadius: "50%",
    cursor: "pointer",
  },
};

const CustomExpandButton = (node: any) => {
  return (
    <>
      {node && (
        <div style={styles.expandBtn}>
          <span>{node.data._directSubordinatesPaging}</span>
          <span style={{ display: "flex" }}>
            {node.children ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </div>
      )}
    </>
  );
};

export default CustomExpandButton;
