import React from "react";

const Skeleton = ({
  height,
  className,
}: {
  height?: string;
  className?: string;
}) => {
  return (
    <div
      style={{ height: height || "58px" }}
      className={`w-full bg-gray-200 rounded-lg animate-pulse ${className}`}
    />
  );
};

export default Skeleton;
