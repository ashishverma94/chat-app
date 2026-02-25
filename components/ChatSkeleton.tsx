import MessageSkeleton from "./MessageSkeleton";

const ChatSkeleton = () => {
  return (
    <div className="w-full flex flex-col justify-between h-full">
        <div className="w-full flex flex-col">

      <div className="border-b border-slate-300 flex items-center h-16 px-5 w-full">
        <div className="flex justify-center items-center flex-row gap-2">
          <div className="size-10 bg-gray-200 animate-pulse rounded-full"></div>
          <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-md"></div>
        </div>
      </div>
      <div className="p-5">
        <MessageSkeleton />
      </div>
        </div>
      <div className=" h-20 border-t gap-4 px-5 flex justify-center items-center border-slate-300 w-full">
        <div className="w-full h-14 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="size-14 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
    </div>
  );
};

export default ChatSkeleton;
