import algosdk from "algosdk";
import { Base64 } from "js-base64";

export const base64ToUTF8String = (base64String) => {
  return Buffer.from(base64String, "base64").toString("utf-8");
};

export const utf8ToBase64String = (utf8String) => {
  return Buffer.from(utf8String, "utf8").toString("base64");
};

// Truncate is done in the middle to allow for checking of first and last chars simply to ensure correct address
export const truncateAddress = (address) => {
  if (!address) return;
  return (
    address.slice(0, 5) +
    "..." +
    address.slice(address.length - 5, address.length)
  );
};

// Amounts in microAlgos (e.g. 10500) are shown as algos (e.g. 10.5) in the frontend
export const microAlgosToString = (num) => {
  if (!num) return;
  return algosdk.microalgosToAlgos(num);
};

// Convert an amount entered as algos (e.g. 10.5) to microAlgos (e.g. 10500)
export const stringToMicroAlgos = (str) => {
  if (!str) return;

  return algosdk.algosToMicroalgos(Number(str));
};

export const convertTime = (secs) => {
  if (secs === 0) {
    return "--";
  }

  let dateObj = new Date(secs * 1000);

  let date = dateObj.toLocaleDateString("en-us", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let time = dateObj.toLocaleString("en-us", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return date + ", " + time;
};

// Convert 32 byte address to readable 58 byte string
export const getAddress = (addr) => {
  if (!addr) return;
  return algosdk.encodeAddress(Base64.toUint8Array(addr));
};
