
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// TODO revise with Plot’s render transform (0.6.10)
function on(mark, listeners = {}) {
  const render = mark.render;
  mark.render = function (facet, { x, y }, channels) {
    // 🌶 I'd like to be allowed to read the facet
    // …  mutable debug = fx.domain()??

    // 🌶 data[i] may or may not be the datum, depending on transforms
    // (at this stage we only have access to the materialized channels we requested)
    // but in simple cases it works
    const data = this.data;

    // 🌶 since a point or band scale doesn't have an inverse, create one from its domain and range
    if (x && x.invert === undefined)
      x.invert = d3.scaleQuantize(x.range(), x.domain());
    if (y && y.invert === undefined)
      y.invert = d3.scaleQuantize(y.range(), y.domain());

    const g = render.apply(this, arguments);
    const r = d3.select(g).selectChildren();
    for (const [type, callback] of Object.entries(listeners)) {
      r.on(type, function (event, i) {
        const p = d3.pointer(event, g);
        callback(event, {
          type,
          p,
          datum: data[i],
          i,
          facet,
          data,
          ...(x && { x: x.invert(p[0]) }),
          ...(y && { y: y.invert(p[1]) }),
          ...(x && channels.x2 && { x2: x.invert(channels.x2[i]) }),
          ...(y && channels.y2 && { y2: y.invert(channels.y2[i]) })
        });
      });
    }
    return g;
  };
  return mark;
} 

async function count_papers(first, second) {
  // const first = 'tocilizumab'
  // const second = 'HLA-DQA1'
  var resp = await (async function() {
    const term = `${first} ${second}`
    const queryParams = {
      email: 'kslowikowski@gmail.com',
      usehistory: 'y', db: 'pubmed', term: term, retmode: 'json'
    }
    const queryString = new URLSearchParams(queryParams).toString()
    return await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${queryString}`)
      .then((response) => {
        return response.json()
      })
  })()
  return +resp.esearchresult.count
}

async function get_papers(first, second) {
  // const first = 'tocilizumab'
  // const second = 'HLA-DQA1'
  var text = await (async function() {
    const term = `${first} ${second}`
    const queryParams = {
      email: 'kslowikowski@gmail.com',
      usehistory: 'y', db: 'pubmed', term: term, retmode: 'json'
    }
    const queryString = new URLSearchParams(queryParams).toString()
    return await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${queryString}`)
      .then((response) => {
        return response.json()
      })
      .then(async (d) => {
        const pubmed_ids = d.esearchresult.idlist
        const queryString = new URLSearchParams({
          WebEnv: d.esearchresult.webenv,
          db: 'pubmed',
          rettype: 'abstract',
          retmode: 'text',
          id: Array.prototype.join.call(pubmed_ids)
        }).toString()
        return await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${queryString}`)
          .then((response) => {
            return response.text()
        })
      })
  })()
  return text.split(/\n\s*\n\s*\n/).map((p) => {
    const items = p.split(/\n\s*\n/)
    const doi = items.find(value => /PMID/.test(value))
    const pmid = doi.match(/PMID: (\d+)/)[1]
    return {
      year: items[0].match(/\d{4}/)[0] + '-01-01',
      journal: items[0],
      title: items[1],
      authors: items[2],
      institutions: items[3],
      abstract: items[4],
      pmid: pmid
    }
  })
}


export { on, count_papers, get_papers }
