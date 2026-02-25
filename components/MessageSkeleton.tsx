import Skeleton from "./Skeleton";

const MessageSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="">
        <Skeleton height="158px" className="max-w-72 md:max-w-md lg:max-w-lg" />
      </div>
      <div className="w-full flex justify-end">
        <Skeleton height="108px" className="max-w-72 md:max-w-md lg:max-w-lg" />
      </div>
      <div className="">
        <Skeleton height="128px" className="max-w-72 md:max-w-md lg:max-w-lg" />
      </div>
      <div className="w-full flex justify-end">
        <Skeleton height="148px" className="max-w-72 md:max-w-md lg:max-w-lg" />
      </div>
    </div>
  );
};

export default MessageSkeleton;
