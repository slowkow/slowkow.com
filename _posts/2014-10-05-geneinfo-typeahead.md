---
layout: post
title: Autocomplete gene names with mygene.info and typeahead.js
tags: Javascript
categories: notes
---

I created an [example][app] showing how to use [mygene.info] with
[typeahead.js]. It is possible to autocomplete gene names and retrieve every
annotation you can think of (GO, Kegg, Ensembl, position, homologs, etc.).

[mygene.info]: http://mygene.info/
[typeahead.js]: https://twitter.github.io/typeahead.js/
[app]: http://codepen.io/slowkow/details/ByxLBE/

# Application

Here is a screenshot:

<img src="/public/images/mygene_typeahead.png" alt="mygene.info with typeahead.js" style="max-width:250px"/>

# Try it here

Start typing in the text box below and you should see suggestions for
completing your gene name. You should see more information if you press
<kbd>Enter</kbd> on your selected gene.

<style>
#scrollable-dropdown-menu {
  text-align: center;
}

input {
  padding: 1em;
  min-width: 400px;
}

#savedResults {
  max-width: 900px;
  margin: 80px auto;
}

#savedResult {
  padding: 8px 12px;
  margin: 20px 0px;
  font-size: 18px;
  line-height: 20px;
  padding: 12px 12px;
  border: 2px solid #ccc;
  -webkit-border-radius: 8px;
     -moz-border-radius: 8px;
          border-radius: 8px;
  outline: none;
}

#input-container {
  margin-top: 5em;
}

.tt-dropdown-menu {
  text-align: left;
  min-width: 400px;
}

.typeahead,
.tt-query,
.tt-hint {
  width: 420px;
  height: 30px;
  padding: 8px 12px;
  font-size: 24px;
  line-height: 30px;
  border: 2px solid #ccc;
  -webkit-border-radius: 8px;
     -moz-border-radius: 8px;
          border-radius: 8px;
  outline: none;
}

.typeahead {
  background-color: #fff;
}

.typeahead:focus {
  border: 2px solid #0097cf;
}

.tt-query {
  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
     -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
          box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
}

.tt-hint {
  color: #999
}

.tt-dropdown-menu {
  width: 480px;
  margin-top: 12px;
  padding: 8px 0;
  background-color: #fff;
  border: 1px solid #ccc;
  border: 1px solid rgba(0, 0, 0, 0.2);
  -webkit-border-radius: 8px;
     -moz-border-radius: 8px;
          border-radius: 8px;
  -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2);
     -moz-box-shadow: 0 5px 10px rgba(0,0,0,.2);
          box-shadow: 0 5px 10px rgba(0,0,0,.2);
}

.tt-suggestion {
  padding: 3px 20px;
  font-size: 18px;
  line-height: 24px;
}

.tt-suggestion.tt-cursor {
  color: #fff;
  background-color: #0097cf;
}

.tt-suggestion p {
  margin: 0;
}
</style>

<div id="input-container">
  <div id="scrollable-dropdown-menu">
    <input class="typeahead" type="text" placeholder="HLA-B">
  </div>
</div>
 
<div id="savedResults"></div>

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.10.5/typeahead.bundle.min.js"></script>
<script type="text/javascript">
var numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

var format = function (form, datum) {
    return form.replace(/{([^}]+)}/g, function (match, key) {
        return typeof datum[key] != 'undefined' ? datum[key] : '';
    });
};

var posToRegion = function (pos) {
    if (pos.chr && pos.start && pos.end) {
        return pos.chr + ':' + numberWithCommas(pos.start) + '-' + numberWithCommas(pos.end);
    }
    return '';
};

var entrezGeneLink = function (datum) {
    var form = 'Entrez: ' +
        '<a href="http://www.ncbi.nlm.nih.gov/gene/{entrezgene}">' +
        '{entrezgene}</a>';
    if (datum.entrezgene) {
        return format(form, datum);
    }
    return '';
};

var hgncGeneLink = function (datum) {
    var form = 'HGNC: ' +
        '<a href="http://www.genenames.org/cgi-bin/gene_symbol_report' +
        '?hgnc_id=HGNC:{HGNC}">{HGNC}</a>';
    if (datum.HGNC) {
        return format(form, datum);
    }
    return '';
};

var jbrowseRegionLink = function (pos) {
    var url = 'http://www.broadinstitute.org/~slowikow/JBrowse-1.10.1/' +
        '?loc={chr}%3A{start}..{end}' +
        '&tracks=Adipose%20-%20Subcutaneous%2CWhole%20Blood' +
        '%2CArtery%20-%20Aorta%2CMuscle%20-%20Skeletal' +
        '%2CBrain%20-%20Hippocampus%2CPituitary' +
        '%2CSkin%20-%20Sun%20Exposed%20(Lower%20leg)%2CStomach' +
        '%2CPancreas%2CColon%20-%20Transverse' +
        '%2CEnsembl%20v72%20Transcripts';
    var form = 'GTEx: <a href="' + url + '">{chr}:{start}-{end}</a>';
    if (pos.chr && pos.start && pos.end) {
        return format(form, pos);
    }
    return '';
};

var ucscRegionLink = function (pos) {
    var form = 'UCSC: ' +
        '<a href="https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19' +
        '&position=chr{chr}%3A{start}-{end}">' +
        '{chr}:{start}-{end}</a>';
    if (pos.chr && pos.start && pos.end) {
        return format(form, pos);
    }
    return '';
};

var gtexRegionLink = function (pos) {
    var form = 'GTEx: ' +
        'http://epigenomegateway.wustl.edu/browser/' +
        '?genome=hg19&coordinate=chr7:26663835-28123541';
};

var formatSuggestion = function (datum) {
    var pos = datum.genomic_pos_hg19;
    var region = '';
    if (pos) {
        if (pos.length > 1) {
            pos = pos[0];
        }
        region = ucscRegionLink(pos);
    }
    var space = '&nbsp;&nbsp;&nbsp;&nbsp;';
    var form = '<div><strong>{symbol}</strong>' +
        ' <span style="font-size:80%">' + space + region + space + hgncGeneLink(datum) + '</span>' +
        '<br>{name}</div>';
    //' Entrez: <a href="http://www.ncbi.nlm.nih.gov/gene/{entrezgene}">{entrezgene}</a>' +
    return format(form, datum);
};

var formatSavedResult = function (datum) {
    var form =
        '<div id="savedResult"><strong>{symbol}</strong>' +
        '&nbsp;&nbsp;' + hgncGeneLink(datum) +
        '<br><p><em>{name}</em></p>';
    var pos = datum.genomic_pos_hg19;
    if (pos) {
        if (pos.length > 1) {
            pos = pos[0];
        }
        form += '<p>' + ucscRegionLink(pos) + '</p>';
            //'&nbsp;&nbsp;' + jbrowseRegionLink(pos) + '</p>';
    }
    form += '<p>{summary}</p></div>';
    return format(form, datum);
};

var engine = new Bloodhound({
    name: 'genes',
    limit: 15,
    remote: {
        url: 'http://mygene.info/v2/query?q=%QUERY*' +
            '&fields=symbol,name,entrezgene,summary,genomic_pos_hg19,HGNC' +
            '&species=human&size=15' +
            '&email=slowikow@broadinstitute.org',
        filter: function (datum) {
            return datum.hits;
        }
    },
    datumTokenizer: function (datum) {
        return Bloodhound.tokenizers.whitespace(datum.val);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace
});

var promise = engine.initialize();

promise.done(function () {
    console.log('success!');
})
    .fail(function () {
    console.log('err!');
});

$('.typeahead').typeahead(null, {
    name: 'genes',
    displayKey: 'symbol',
    source: engine.ttAdapter(),
    templates: {
        suggestion: formatSuggestion
    }
});

$('.typeahead').on('typeahead:selected', function (obj, datum, name) {
    console.log(datum);
    $("#savedResults").prepend(formatSavedResult(datum));
});
</script>
