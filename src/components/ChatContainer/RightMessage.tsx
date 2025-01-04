import Image from "next/image";
import AvaSauron from "../../../public/img/ava-sauron.png";
import React, { memo } from "react";

interface IMessageData {
  messages: string[];
  avatar?: string;
  avatarName?: string;
}

const RightMessage = ({ messages, avatar, avatarName }: IMessageData) => {
  return (
    <div className="sent-message flex flex-col gap-2 items-end">
      <div className="flex flex-row-reverse items-start justify-end relative pt-6">
        <div className="absolute top-[-16px] right-[-14px] flex justify-start items-center z-[20]">
          <p className="text-white relative top-[-9px] text-xl font-lotr">{avatarName || "Sauron"}</p>
          <Image
            src={avatar || AvaSauron}
            alt="avatar"
            width={64}
            height={64}
            className="w-[64px] h-[64px] rounded-full"
          />
        </div>
        <div className="flex flex-col items-end gap-1 relative">
          {messages.map((message, index) => (
            <div
              key={index}
              className="bg-[#571a21cc] text-white rounded-lg p-3 max-w-[84%] blur-bg"
            >
              <p className="text-[18px] leading-6 break-words whitespace-break-spaces">
                {message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(RightMessage);
