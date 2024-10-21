import moment from "moment-timezone";

export const calcDate = (monthCount, start, end) => {
  const timeZone = "Asia/Baku";

  if (monthCount) {
    monthCount = Number(monthCount);

    const startDate = moment
      .tz(timeZone)
      .subtract(monthCount - 1, "months")
      .startOf("month")
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);

    // Azərbaycan vaxtında bitiş tarixi hesabla
    const endDate = moment
      .tz(timeZone)
      .add(0, "months")
      .endOf("month")
      .hours(23)
      .minutes(59)
      .seconds(59)
      .milliseconds(999);

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  } else if (start && end) {
    const startDateISO = new Date(start).toISOString();
    const endDateISO = new Date(end).toISOString();

    const startDate = moment
      .tz(startDateISO, timeZone)
      .startOf("day")
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);
    const endDate = moment
      .tz(endDateISO, timeZone)
      .endOf("day")
      .hours(23)
      .minutes(59)
      .seconds(59)
      .milliseconds(999);

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  }
};

export const calcDateWithMonthly = (start, end) => {
  const timeZone = "Asia/Baku"; // Azərbaycan vaxt qurşağı

  let startDate;
  let endDate;

  console.log(start, "start");
  console.log(end, "end");

  if (start && end) {
    const startDateISO = new Date(start).toISOString();
    const endDateISO = new Date(end).toISOString();

    startDate = moment
      .tz(startDateISO, timeZone)
      .startOf("month")
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);
    endDate = moment
      .tz(endDateISO, timeZone)
      .endOf("month")
      .hours(23)
      .minutes(59)
      .seconds(59)
      .milliseconds(999);
  } else {
    startDate = moment
      .tz(timeZone)
      .startOf("month")
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);
    endDate = moment
      .tz(timeZone)
      .endOf("month")
      .hours(23)
      .minutes(59)
      .seconds(59)
      .milliseconds(999);
  }

  return {
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
  };
};
