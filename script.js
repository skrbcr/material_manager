let maxId;

function link(cell, formatterParams) {
	var url = cell.getValue();
	return "<a class=\"hlink_table\" href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
}

var table = new Tabulator("#main-table", {
	// data: tabledata,
	// layout: "fitColumns",
	// responsiveLayout: "hide",
	height: 450,
	// maxHeight: "100%",
	addRowPos: "top",
	history: true,
	movableColumns: true,
	initialSort: [
		{ column: "author", dir: "asc"},
		{ column: "type", dir: "asc" },
	],
	columnDefaults: {
		tooltip: true,
	},
	groupBy: "type",
	// autoColumns: true,
	rowHeader: { headerSort: false, resizable: false, frozen: true, headerHozAlign: "center", hozAlign: "center", formatter: "rowSelection", titleFormatter: "rowSelection", cellClick:function(e, cell) {
		cell.getRow().toggleSelect();
	} },
	columns: [
		{ title: "ID", width: 50, field: "id" },
		{ title: "作者", width: 90, field: "author", editor: "input" },
		{ title: "作品名", width: 100, field: "name", editor: "input" },
		{ title: "作品名（詳細）", width: 135, field: "name_detail", editor: "input" },
		{ title: "種類", width: 100, field: "type", editor: "input" },
		{ title: "URL", width: 200, field: "url", formatter: link, editor: "input" },
		{ title: "ニコニコ作品番号", width: 100, field: "niconico", editor: "input" },
		{ title: "ニコニコ利用", width: 50, field: "available_nico", formatter:"tickCross", sorter: "boolean", editor: true },
		{ title: "YouTube 利用", width: 50, field: "available_yt", formatter:"tickCross", sorter: "boolean", editor: true },
		{ title: "その他利用", width: 50, field: "available_others", formatter:"tickCross", sorter: "boolean", editor: true },
		{ title: "改変", width: 50, field: "available_mod", formatter:"tickCross", sorter: "boolean", editor: true },
		{ title: "その他", width: 150, field: "others", editor: "input" },
		{ title: "削除", formatter:"buttonCross", width: 50, hozAlign:"center", cellClick:function(e, cell){
			if (confirm("本当にこの素材を削除しますか？")) {
    		cell.getRow().delete();
				maxId -= 1;
			}
		}},
	]
});

document.getElementById("add-col").addEventListener("click", function() {
	maxId += 1;
  table.addRow({ id: maxId, url: "" });
});

document.getElementById("output-nico").addEventListener("click", async function() {
	let selectedRows = table.getSelectedData();
	let strOut = "";
	for (const element of selectedRows) {
		if (element.niconico != "") {
			strOut += element.niconico + ", ";
		}
	}
	// console.log(strOut);
	const handle = await window.showSaveFilePicker({
		suggestedName: "親作品番号",
		types: [{
			description: "Text file",
			accept: {"text/plain": [".txt"]},
		}],
	});
	const writable = await handle.createWritable();
	await writable.write(strOut);
	await writable.close();
});

document.getElementById("save-project").addEventListener("click", async function() {
	let selectedRows = table.getSelectedData();
	let selectedRowIndices = [];
	for (const element of selectedRows) {
		// console.log(element);
		selectedRowIndices.push(element.id);
	}
	// console.log(selectedRowIndices);
	let jsonOut = table.getData();
	jsonOut.forEach(row => {
		// console.log(row);
		row.select = selectedRowIndices.includes(row.id);
	});
	const pickerOpts = {
		suggestedName: "project",
		types: [{
			description: "JSON files",
			accept: { "application/json": [ ".json" ] },
		}],
	}
	const handle = await window.showSaveFilePicker(pickerOpts);
	const writable = await handle.createWritable();
	await writable.write(JSON.stringify(jsonOut, null, 2));
	await writable.close();
});

document.getElementById("open-project").addEventListener("click", async function() {
	const pickerOpts = {
		types: [{
			description: "JSON files",
			accept: { "application/json": [ ".json" ] },
		}],
		excludeAcceptAllOption: true,
		multiple: false,
	};
	let [fileHandle] = await window.showOpenFilePicker(pickerOpts);
	const file = await fileHandle.getFile();
	const fileContent = await file.text();
	const tableData = JSON.parse(fileContent);
	table.setData(tableData);
	for (const element of tableData) {
		if (element.select) {
			table.selectRow(element.id);
		}
	}
	maxId = Math.max(...tableData.map(row => row.id));
})
