YUI.add("threel-explore", function (Y) {
    var YAHOO = Y.YUI2;

    function createDT (source) {

        var columns = [
            {
                key : "method",
                label : "Method",
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
                "method",
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
            d = d.req || d.res;
            d = d.pop();
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
    Y.ThreeL.on("socket:json", function (d) {
        console.log(d);
        ensureTXN(d);
        var type = d.req ? "req" : "res";
        d = d.req || d.res;
        d = d.pop();


        txns[d.id].index = getIndex();        

        // if (!txns[d.id].rgb) // ?

        console.log("YAY", d);

        if (!txns[d.id].active) {
            dt.addRow(d, txns[d.id].index);
        }

    });

/*
 
        var formatUrl = function(elCell, oRecord, oColumn, sData) {
            elCell.innerHTML = "<a href='" + oRecord.getData("url") + "' target='_blank'>" + sData + "</a>";
        };
 
        var formatImg = function (elCell, oRecord, oColumn, sData) {
            elCell.innerHTML = "<img src='" + sData + "'/>";
        };
 
        var myColumnDefs = [
            {key:"image_url_155x125", label:"Image", formatter:formatImg},
            {key:"title", label:"Name", sortable:true, formatter:formatUrl},
            {key:"user_name", label:"User"}
        ];
*/
}, "0.0.1", { requires : [
    "threel-base",
    "yui2-datatable"
]});
