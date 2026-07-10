const { getAllLogs } = require("./memory.service");

/**
 * Tìm log theo tên file
 */
function findByFile(fileName) {

    const logs = getAllLogs();

    return logs.filter(entry =>
        entry.files.some(file =>
            file.file.toLowerCase().includes(fileName.toLowerCase())
        )
    );

}

/**
 * Tìm log theo message
 */
function findByMessage(keyword) {

    const logs = getAllLogs();

    return logs.filter(entry =>
        entry.message
            .toLowerCase()
            .includes(keyword.toLowerCase())
    );

}

const args = process.argv.slice(2);

switch (args[0]) {

    case "file":

        console.log(
            findByFile(args[1] || "")
        );

        break;

    case "msg":

        console.log(
            findByMessage(args[1] || "")
        );

        break;

    default:

        console.log("Usage:");

        console.log("node devos query file ArmyManager");

        console.log("node devos query msg fix");

}