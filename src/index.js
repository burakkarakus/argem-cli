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
  readData,
} from "./helper.js";

async function mainPrompt() {
  console.log(figlet.textSync("Argem CLI ", { font: "Doom" }));
  console.log("\n");

  if (!isAlreadyLogedIn()) {
    await loginPrompt();
  }
  const { timesheet, selectedDates } = await timeTablePrompt();

  const selectedActivity = await activityPrompt();

  const selectedProject = await projectPrompt();

  await enterWorkLogPrompt(
    timesheet,
    selectedDates,
    selectedActivity,
    selectedProject
  );
}

async function loginPrompt() {
  console.log("Giriş yapmanız gerekiyor.");

  const { email } = await inquirer.prompt({
    name: "email",
    type: "input",
    message: "E-mail adresi:",
  });
  const { password } = await inquirer.prompt({
    name: "password",
    type: "password",
    message: "Şifre:",
  });

  const {
    data: { token },
    headers,
  } = await ArgemService.login(email, password);

  persistData({
    token,
    Cookie: headers["set-cookie"]?.join(";"),
    email,
    password,
  });
  ArgemService.init();
}

async function reloginPrompt() {
  console.log("Tekrardan giriş yapılıyor");

  const { email, password } = readData();
  purgeData();
  ArgemService.init();

  const {
    data: { token },
    headers,
  } = await ArgemService.login(email, password);

  persistData({
    token,
    Cookie: headers["set-cookie"]?.join(";"),
    email,
    password,
  });
  ArgemService.init();
}

async function timeTablePrompt() {
  let timesheet = null;
  try {
    const {
      data: { data },
    } = await ArgemService.getTimeTable();
    timesheet = data?.filter((day, index) => !day.completed && index < 100);
  } catch (error) {
    if (error.response.status === 401) {
      await reloginPrompt();
      return await timeTablePrompt();
    }
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

  return { timesheet, selectedDates };
}

async function activityPrompt() {
  const {
    data: { data },
  } = await ArgemService.getActivities();
  const acvities = data?.filter((activity) => activity.item_status === 1);

  const selectedActivity = await select({
    message: "Aktivite seçiniz: ",
    choices: acvities.map((activity) => ({
      name: activity.label,
      value: activity.key,
    })),
  });

  return selectedActivity;
}

async function projectPrompt() {
  const {
    data: { data },
  } = await ArgemService.getProjects();

  const selectedProject = await select({
    message: "Projenizi seçiniz: ",
    choices: data.map((activity) => ({
      name: activity.label,
      value: activity.key,
    })),
  });

  return selectedProject;
}

async function enterWorkLogPrompt(timesheets, dates, activity, project) {
  console.log("\nArgem girişleriniz gerçekleştiriliyor...\n");

  dates.forEach(async (id) => {
    const timesheet = timesheets.find((ts) => ts.id === id);
    const total_time = calculateMissingTime(timesheet.totaltime);

    await ArgemService.enterWorklog(id, activity, project, total_time);
    console.log(
      chalk.greenBright(
        `${getDateString(
          timesheet.date
        )} günü için mesai girişi tamamlandı. Girilen toplam mesai süresi: ${total_time}`
      )
    );
  });
}

mainPrompt();
