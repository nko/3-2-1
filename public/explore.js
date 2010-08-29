YUI.add("threel-explore", function (Y) {
    var YAHOO = Y.YUI2;

    function createDT (source) {

        var columns = [
            {
                key : "rgb",
                label : "Color",
                formatter : function (cell, record, col, data) {
                    data.pop();
                    cell.innerHTML = "<div style='background: rgb(" + data.join(",") + "); width: 24px; height: 24px;'>&nbsp;</div>";
                }
            },
            {
                key : "method",
                label : "Method",
            },
            {
                key : "url",
                label : "Path",
            },
            {
                key : "srcIP",
                label : "Source IP",
                sortable : true
            }
        ];

        var ds = new YAHOO.util.DataSource(source);
        ds.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
        ds.responseSchema = {
            resultsList : "",
            fields : [
                "color",
                "method",
                "path",
                "srcIP",
            ]
        };

        var dt = new YAHOO.widget.DataTable(
            "requests",
            columns,
            ds,
            {
                initialRequest : ""
            }
        );

        return dt;

    }

    // private txn store
    var txns = {};

    function ensureTXN (d) {
        var id = d;
        if (typeof d === "object") {
            if (!d) Y.ThreeL.fire("error", "Data object is empty in Explore.");
            id = d.id;
        }
        if (!(id in txns)) txns[id] = {
            active : false
        };
    }

    // from gfx, totally optional
    Y.ThreeL.on("txn:color", function (id, d) {
        ensureTXN(id);
        txns[id].rgb = d;
        // syncui
    });

    var getIndex = (function () {
        var idx = 0;
        return function () {
            return idx++;
        }
    })();

    var dt = createDT({});

    // from base
    Y.ThreeL.on("socket:json", function (d, type) {
        if (type !== "req") return;
        ensureTXN(d);

        txns[d.id].index = getIndex();        

        if (!txns[d.id].active) {
            d.rgb = txns[d.id].rgb;
            dt.addRow(d, txns[d.id].index);
        }

    });

}, "0.0.1", { requires : [
    "threel-base",
    "yui2-datatable"
]});
