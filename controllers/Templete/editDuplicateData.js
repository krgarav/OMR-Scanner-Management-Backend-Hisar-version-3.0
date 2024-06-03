const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const Files = require("../../models/TempleteModel/files");
const UpdatedData = require("../../models/TempleteModel/updatedData");
const jsonToCsv = require("../../services/json_to_csv");

const editDuplicateData = async (req, res, next) => {
  const { index, fileID, rowData, updatedColumn } = req.body;

  try {
    if (!fileID) {
      return res.status(400).json({ error: "File ID not provided" });
    }

    const fileData = await Files.findByPk(fileID);

    if (!fileData || !fileData.csvFile) {
      return res.status(404).json({ error: "File not found" });
    }

    const filename = fileData.csvFile;
    const filePath = path.join(__dirname, "../../csvFile", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      defval: "",
      header: 1,
    });

    // Find the index of the column with the heading "User Details" and "Updated Details"
    let userDetailsIndex = data[0].indexOf("User Details");
    let previousValueIndex = data[0].indexOf("Previous Values");
    let updatedValueIndex = data[0].indexOf("Updated Values");
    let updatedColIndex = data[0].indexOf("Updated Col. Name");

    if (userDetailsIndex === -1) {
      data[0].push("User Details");
      userDetailsIndex = data[0].length - 1;
    }

    if (previousValueIndex === -1) {
      data[0].push("Previous Values");
      previousValueIndex = data[0].length - 1;
    }

    if (updatedValueIndex === -1) {
      data[0].push("Updated Values");
      updatedValueIndex = data[0].length - 1;
    }

    if (updatedColIndex === -1) {
      data[0].push("Updated Col. Name");
      updatedColIndex = data[0].length - 1;
    }

    // Initialize "User Details" and "Updated Details" columns with "No change" if it's the first time the file is created

    for (let i = 1; i < data.length; i++) {
      if (data[i][userDetailsIndex] === undefined) {
        data[i][userDetailsIndex] = "No change";
      }

      if (data[i][previousValueIndex] === undefined) {
        data[i][previousValueIndex] = "No change";
      }

      if (data[i][updatedValueIndex] === undefined) {
        data[i][updatedValueIndex] = "No change";
      }

      if (data[i][updatedColIndex] === undefined) {
        data[i][updatedColIndex] = "No change";
      }
    }

    // Update the specific row in the array
    data[index + 1] = Object.values(rowData);

    // Update the specific row in the array with userName and email
    data[index + 1][userDetailsIndex] = `${req.userId}`;
    data[index + 1][previousValueIndex] = `${Object.keys(updatedColumn).map(
      (key) => updatedColumn[key][1]
    )}`;
    data[index + 1][updatedValueIndex] = `${Object.keys(updatedColumn).map(
      (key) => updatedColumn[key][0]
    )}`;
    data[index + 1][updatedColIndex] = `${Object.keys(updatedColumn)}`;

    await UpdatedData.create({
      updatedColumn: `${Object.keys(updatedColumn)}`,
      previousData: `${Object.keys(updatedColumn).map(
        (key) => updatedColumn[key][1]
      )}`,
      currentData: `${Object.keys(updatedColumn).map(
        (key) => updatedColumn[key][0]
      )}`,
      fileId: fileID,
      userId: req.userId,
    });

    // Convert the updated array of rows back to JSON format
    const jsonArray = [];
    const headers = data[0];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowObject = {};
      for (let j = 0; j < headers.length; j++) {
        rowObject[headers[j]] = row[j];
      }
      jsonArray.push(rowObject);
    }

    // Convert the updated JSON data back to CSV format using the jsonToCsv function
    const updatedCSVContent = jsonToCsv(jsonArray);

    if (updatedCSVContent === null) {
      throw new Error("Error converting updated JSON to CSV");
    }

    fs.unlinkSync(filePath);
    fs.writeFileSync(filePath, updatedCSVContent, {
      encoding: "utf8",
    });
    return res.status(200).json({ message: "Data Updated successfully" });
  } catch (error) {
    console.error("Error handling data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = editDuplicateData;
