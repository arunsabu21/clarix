import { createContext, useContext, useState } from "react";
import Message from "../components/common/Alert";

const MessageContext = createContext();

export function MessageProvider({ children }) {
  const [msg, setMsg] = useState(null);

  return (
    <MessageContext.Provider value={{ setMsg }}>
      {children}

      <Message type={msg?.type} text={msg?.text} onClose={() => setMsg(null)} />
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
