let maxId = 1;
let bChanged = false;

function link_url(cell, formatterParams) {
	let url = cell.getValue();
	return "<a class=\"hlink_table\" href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
}

function cell_edited(cell) {
	console.log("cellEdited");
	bChanged = true;
}

function alert_unsave(e) {
	if (bChanged) {
		e.preventDefault();
		e.returnValue = "";
	}
}

let table_init = [
    { id: 1, url: "" },
];

let headerMenu = function() {
    let menu = [];
    let columns = this.getColumns();

    for (let column of columns) {
        if (column.getDefinition().title == "selection") continue;
        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square");
        let label = document.createElement("span");
        let title = document.createElement("span");
        title.textContent = " " + column.getDefinition().title;
        label.appendChild(icon);
        label.appendChild(title);

        menu.push({
            label: label,
            action: function(e) {
                e.stopPropagation();
                column.toggle();
                if (column.isVisible()) {
                    icon.classList.remove("fa-square");
                    icon.classList.add("fa-check-square");
                }
                else {
                    icon.classList.remove("fa-check-square");
                    icon.classList.add("fa-square");
                }
            },
        });
    }
    return menu;
};

let table = new Tabulator("#main-table", {
	data: table_init,
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
	rowHeader: { title: "selection", headerSort: false, resizable: false, frozen: true, headerHozAlign: "center", hozAlign: "center", formatter: "rowSelection", titleFormatter: "rowSelection", cellClick:function(e, cell) {
		cell.getRow().toggleSelect();
	},
        headerMenu: headerMenu, },
    rowContextMenu: [
        {
            label: "素材を追加",
            action: function(e, row) {
                maxId += 1;
                table.addRow({ id: maxId, url: "" });
            }
        },
        {
            label: "素材を削除",
            action: function(e, row) {
			    if (confirm("本当にこの素材を削除しますか？")) {
                    // console.log(row);
                    row.delete();
                }
            }
        },
    ],
	columns: [
		{ title: "ID", width: 50, field: "id" },
		{ title: "作者", width: 90, field: "author", editor: "input", cellEdited: cell_edited },
		{ title: "作品名", width: 200, field: "name", editor: "input", cellEdited: cell_edited },
		// { title: "作品名（詳細）", width: 135, field: "name_detail", editor: "input", cellEdited: cell_edited },
		{ title: "種類", width: 100, field: "type", editor: "input", cellEdited: cell_edited },
		{ title: "URL", width: 200, field: "url", formatter: link_url, editor: "input", cellEdited: cell_edited },
		{ title: "ニコニコ作品番号", width: 100, field: "niconico", editor: "input", cellEdited: cell_edited },
		{ title: "ニコニコ利用", width: 50, field: "available_nico", formatter: "tickCross", sorter: "boolean", editor: true, cellEdited: cell_edited },
		{ title: "YouTube 利用", width: 50, field: "available_yt", formatter: "tickCross", sorter: "boolean", editor: true, cellEdited: cell_edited },
		{ title: "その他利用", width: 50, field: "available_others", formatter: "tickCross", sorter: "boolean", editor: true, cellEdited: cell_edited },
        { title: "商用利用", width: 50, field: "available_commerce", formatter: "tickCross", sorter: "boolean", editor: true, cellEdited: cell_edited },
		{ title: "改変", width: 50, field: "available_mod", formatter: "tickCross", sorter: "boolean", editor: true, cellEdited: cell_edited },
		{ title: "その他", width: 150, field: "others", editor: "input", cellEdited: cell_edited },
	]
});

table.on("rowSelectionChanged", function(data, rows, selected, deselected) {
	console.log("row selection changed");
	bChanged = true;
});

document.getElementById("output-nico").addEventListener("click", async function() {
	let selectedRows = table.getSelectedData();
	let strOut = "";
	for (const element of selectedRows) {
		if (element.niconico != "") {
			strOut += element.niconico + " ";
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
	bChanged = false;
});

document.getElementById("open-project").addEventListener("click", async function() {
	if (bChanged && !confirm("未保存の内容があります。放棄してファイルを開きますか？")) {
		return;
	}
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
	bChanged = false;
})

window.addEventListener("onLoad", function(e) {
    console.log("load");
});

window.addEventListener("beforeunload", alert_unsave);
