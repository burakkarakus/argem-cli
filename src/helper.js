import fs from "fs";
import os from "os";

const FOLDER_PATH = `${os.homedir()}/.argem`;
const FILE_NAME = `token.json`;

export function isAlreadyLogedIn() {
  if (!fs.existsSync(`${FOLDER_PATH}/${FILE_NAME}`)) {
    return false;
  }

  try {
    const data = fs.readFileSync(`${FOLDER_PATH}/${FILE_NAME}`, {
      flag: "r",
      encoding: "utf8",
    });
    const { authToken } = JSON.parse(data);
    return !!authToken;
  } catch (error) {
    return false;
  }
}

export function persistData(data) {
  fs.mkdirSync(FOLDER_PATH, { recursive: true });
  fs.writeFileSync(`${FOLDER_PATH}/${FILE_NAME}`, JSON.stringify({}));

  fs.writeFileSync(`${FOLDER_PATH}/${FILE_NAME}`, JSON.stringify(data));
}

export function purgeData() {
  fs.unlinkSync(`${FOLDER_PATH}/${FILE_NAME}`);
}

export function readData() {
  try {
    const file = fs.readFileSync(`${FOLDER_PATH}/${FILE_NAME}`, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(file);
  } catch (error) {
    return null;
  }
}

const getLocalizedDay = (date) => {
  return date.toLocaleString("tr-TR", { weekday: "long" });
};

const getFullDate = (date) => {
  const event = new Date(date);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const fullDate = event.toLocaleDateString("tr-TR", options);
  return fullDate;
};

export function getDateString(date) {
  const currentDate = new Date(date);
  return `${getFullDate(currentDate)}, ${getLocalizedDay(currentDate)}`;
}

export function doubleDigit(val) {
  return `00${val}`.slice(-2);
}

export function calculateMissingTime(totalTime) {
  const spendedHour = Number(totalTime.split(":")[0]);
  const spendedMin = Number(totalTime.split(":")[1]);
  const totalSpendedTime = spendedHour * 60 + spendedMin;
  const missingTime = 60 * 8 - totalSpendedTime;

  return `${doubleDigit(Math.floor(missingTime / 60))}:${doubleDigit(
    missingTime % 60
  )}`;
}
