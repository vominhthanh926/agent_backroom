import React, { memo } from "react";
import AvaGandalf from "../../../public/img/ava-gandalf.png";
import Image from "next/image";

interface IMessageData {
  messages: string[];
  avatar?: string;
  avatarName?: string;
}

const LeftMessage = ({ messages, avatar, avatarName }: IMessageData) => {
  return (
    <div className="receive-message flex items-start relative pt-6">
      <div className="absolute top-[-18px] left-[-14px] flex justify-start items-center z-20">
        <Image
          src={avatar || AvaGandalf}
          alt="avatar"
          width={64}
          height={64}
          className="w-[64px] h-[64px] rounded-full"
        />
        <p className="text-white relative top-[-8px] text-xl font-lotr">
          {avatarName || "Gandalf"}
        </p>
      </div>
      {/* block message receive */}
      <div className="wrap-bubbles flex flex-col gap-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className="bg-[#434a35cc] text-white rounded-lg p-3 max-w-[84%] blur-bg"
          >
            <p className="text-[18px] leading-6 break-words whitespace-break-spaces">
              {message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(LeftMessage);
