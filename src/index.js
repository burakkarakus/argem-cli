#!/usr/bin/env node

import inquirer from "inquirer";
import checkbox from "@inquirer/checkbox";
import select from "@inquirer/select";
import chalk from "chalk";
import ArgemService from "./service.js";
import figlet from "figlet";
import {
  calculateMissingTime,
  getDateString,
  isAlreadyLogedIn,
  persistData,
  purgeData,
} from "./helper.js";

async function mainPrompt() {
  console.log(figlet.textSync("Argem CLI ", { font: "Doom" }));
  console.log("\n");

  if (!isAlreadyLogedIn()) {
    await loginPrompt();
  }
  const selecetedSheets = await timeTablePrompt();

  const selectedActivity = await activityPrompt(
    selecetedSheets[0].date,
    selecetedSheets[0].id
  );

  await enterWorkLogPrompt(selecetedSheets, selectedActivity);
}

async function loginPrompt() {
  console.log("Giriş yapmanız gerekiyor.");

  const { authToken } = await inquirer.prompt({
    type: "input",
    name: "authToken",
    message: "Lütfen next-auth.session-token isimli cookie'yi giriniz:",
  });
  persistData({
    authToken,
  });
  ArgemService.init();
}

async function timeTablePrompt() {
  let timesheet = null;
  try {
    const {
      data: { data },
    } = await ArgemService.getTimeTable();
    if (!data) throw new Error("Liste boş olamaz");
    timesheet = data?.rows?.filter(
      (day, index) => !day.completed && index < 100 && index > 0
    );
  } catch (error) {
    purgeData();
    console.log(chalk.red("next-auth.session-token expired olmuş olabilir."));
    await loginPrompt();
    return await timeTablePrompt();
  }

  if (!timesheet?.length) {
    console.log(chalk.greenBright("Eksik gününüz bulunmamaktadır 🎉🎉🎉\n"));
    process.exit(0);
  }

  let selectedDates = null;

  while (!selectedDates?.length) {
    selectedDates = await checkbox({
      message: "Doldurmak istediğiniz günleri seçiniz: ",
      choices: timesheet.map((sheet) => ({
        name: getDateString(sheet.date),
        value: sheet.id,
      })),
    });
    if (!selectedDates.length) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(1);
      console.log(chalk.redBright("Hiçbir tarih seçmediniz!"));
    }
  }
  return timesheet.filter((sheet) => selectedDates.includes(sheet.id));
}

async function activityPrompt(date, wid) {
  const {
    data: { data },
  } = await ArgemService.getActivities(date, wid);

  const selectedActivity = await select({
    message: "Aktivite seçiniz: ",
    choices: data.map((activity) => ({
      name: activity.name,
      value: activity.id,
    })),
  });

  return selectedActivity;
}

async function enterWorkLogPrompt(timeSheets, project) {
  console.log("\nArgem girişleriniz gerçekleştiriliyor...\n");

  const {
    data: { data },
  } = await ArgemService.getProjects();
  const activity = data.find((d) => d.value.toLowerCase().includes("covid"));

  timeSheets.forEach(async (sheet) => {
    const missingTime = calculateMissingTime(sheet.totalTime);
    await ArgemService.enterWorklog(
      sheet.id,
      sheet.date,
      activity.id,
      project,
      missingTime
    );
    console.log(
      chalk.greenBright(
        `${getDateString(
          sheet.date
        )} günü için mesai girişi tamamlandı. Girilen toplam mesai süresi: ${missingTime}`
      )
    );
  });
}

mainPrompt();
