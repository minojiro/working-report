import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import gitlog from "gitlog";
import * as settings from "./settings";
import { stringify as csvStringify } from "csv";

const ISSUE_URL_REGEXP = /https:\/\/github\.com\/.*?\/.*?\/issues\/\d+/;

const getList = () => {
  const today = dayjs().subtract(10);
  const startDate = today.clone().startOf("month");
  const endDate = today.clone().endOf("month");
  const issueUrlsGroupedByDate = Array.from(
    { length: endDate.date() },
    () => [] as string[]
  );

  const commits = settings.REPOSITORIES.flatMap((repo) =>
    gitlog({
      repo,
      before: startDate.format(),
      until: endDate.format(),
      author: settings.AUTHOR,
      number: 300,
      fields: ["authorName", "authorDate", "body"],
    })
  );

  for (const commit of commits) {
    const date = dayjs(commit.authorDate);
    const issueUrlMatch = commit.body.match(ISSUE_URL_REGEXP);
    const issueUrl = issueUrlMatch && issueUrlMatch[0];
    if (date > endDate || date < startDate || !issueUrl) {
      continue;
    }

    const index = date.diff(startDate, "days");
    if (issueUrlsGroupedByDate[index].indexOf(issueUrl) === -1) {
      issueUrlsGroupedByDate[index].push(issueUrl);
    }
  }

  const calender = issueUrlsGroupedByDate.map((urls, i) => {
    const currentDate = startDate.clone().add(i, "days").format("YYYY/MM/DD");
    return [currentDate, urls.join("\n")];
  });

  const csvFilePath = path.join(
    __dirname,
    `../out/${today.format("YYYY-MM")}.csv`
  );

  csvStringify(calender, (err, data) => {
    if (err) throw err;

    fs.writeFile(csvFilePath, data, (err) => {
      if (err) throw err;
      console.log(`🎉 done: ${csvFilePath}`);
    });
  });
};

getList();
