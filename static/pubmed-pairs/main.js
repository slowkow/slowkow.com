
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// import { on, count_papers, get_papers } from "./pubmed-pairs/papers.js"

// window.count_papers = count_papers
// window.get_papers = get_papers

//// TODO revise with Plot’s render transform (0.6.10)
//function on(mark, listeners = {}) {
//  const render = mark.render;
//  mark.render = function (facet, { x, y }, channels) {
//    // 🌶 I'd like to be allowed to read the facet
//    // …  mutable debug = fx.domain()??
//    // 🌶 data[i] may or may not be the datum, depending on transforms
//    // (at this stage we only have access to the materialized channels we requested)
//    // but in simple cases it works
//    const data = this.data;
//    // 🌶 since a point or band scale doesn't have an inverse, create one from its domain and range
//    if (x && x.invert === undefined)
//      x.invert = d3.scaleQuantize(x.range(), x.domain());
//    if (y && y.invert === undefined)
//      y.invert = d3.scaleQuantize(y.range(), y.domain());
//    const g = render.apply(this, arguments);
//    const r = d3.select(g).selectChildren();
//    for (const [type, callback] of Object.entries(listeners)) {
//      r.on(type, function (event, i) {
//        const p = d3.pointer(event, g);
//        callback(event, {
//          type,
//          p,
//          datum: data[i],
//          i,
//          facet,
//          data,
//          ...(x && { x: x.invert(p[0]) }),
//          ...(y && { y: y.invert(p[1]) }),
//          ...(x && channels.x2 && { x2: x.invert(channels.x2[i]) }),
//          ...(y && channels.y2 && { y2: y.invert(channels.y2[i]) })
//        });
//      });
//    }
//    return g;
//  };
//  return mark;
//} 

var count_papers_cache = {}

async function count_papers(first, second) {
  const term = `${first} ${second}`
  if (term in count_papers_cache) {
    resp = count_papers_cache[term]
    return +resp.esearchresult.count
  }
  // const first = 'tocilizumab'
  // const second = 'HLA-DQA1'
  var resp = await (async function() {
    const queryParams = {
      email: 'kslowikowski@gmail.com',
      usehistory: 'y', db: 'pubmed', term: term, retmode: 'json'
    }
    const queryString = new URLSearchParams(queryParams).toString()
    console.log('fetch eutils esearch')
    return await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${queryString}`)
      .then((response) => {
        return response.json()
      })
  })()
  count_papers_cache[term] = resp
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


const timer = ms => new Promise(res => setTimeout(res, ms))

function pairs(first, second) {
	var pairs = []
  for (const x of first) {
    for (const y of second) {
      pairs.push(`${x} ${y}`)
    }
  }
  return pairs
}

const click_search = async function() {
  var retval = []
  // const first = document.getElementById("first").value.split(/[ ,;]+/)
  // const second = document.getElementById("second").value.split(/[ ,;]+/)
  const first = document.getElementById("first").value.split(/,/)
  const second = document.getElementById("second").value.split(/,/)
  const ps = pairs(first, second)
  const info =  document.getElementById("info")
  info.innerText = `${ps.length} pairs: ${ps.join(', ')}`
  for (const x of first) {
    for (const y of second) {
  		console.log(`counting papers: ${x} ${y}`)
      const n = await count_papers(x, y)
      retval.push({
        'pair': `${x} ${y}`, 'first': x, 'second': y, 'count': n
      })
      build_table(retval)
			await timer(1000)
    }
  }
  return retval
}

const search = document.getElementById("search-button")
search.onclick = async function() {
	const data = await click_search()
	build_table(data)
}

async function build_table(data) {
	var head = `<thead><td>query</td><td>papers</td></thead>`
	var rows = [head]
	for (const d of data) {
		var count = `<span class="hits" id="${d.pair}">${d.count}</span>`
		rows.push(`<tr><td>${d.pair}</td><td>${count}</td></tr>`)
	}
	var table = `<table>${rows.join('')}</table>`
	document.getElementById("table").innerHTML = table
	var first = true
	for (const d of data) {
		if (first) {
			const papers = await get_papers(d.first, d.second)
			build_papers(papers, d.pair)
			first = false
		}
		var el = document.getElementById(d.pair)
		el.onclick = async function() {
			// console.log(d.pair)
			const papers = await get_papers(d.first, d.second)
			build_papers(papers, d.pair)
		}
	}
}

function build_papers(papers, title) {
	const papers_title = document.getElementById("papers-title")
	papers_title.innerText = title
	const papers_div = document.getElementById("papers")
  var rows = []
	for (const p of papers) {
    var html = `<article class="pv1">
        <div class="flex flex-row">
          <div class="w-100">
            <p class="f5 fw4 lh-title mv0"><a target="_blank" rel="noopener noreferrer" href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}">${p.title}</a></p>
            <p class="f7 lh-copy mv0">${p.authors}</p>
            <p class="f7 lh-copy mv0">${p.journal.substr(3)}</p>
            <p class="f7 lh-copy mv0">PMID: <span class="pmid">${p.pmid}</span></p>
            <p class="f7 lh-copy">${p.abstract.substr(0, 300)}<span class="dots"> (...)</span><span class="more">${p.abstract.substr(300)}</span></p>
          </div>
        </div>
      </article>`
    rows.push(html)
  }
	papers_div.innerHTML = rows.join('\n')
  const dots = document.getElementsByClassName("dots")
  for (const dot of dots) {
    dot.onclick = function() {
      dot.nextElementSibling.style.display = 'inline'
      dot.style.display = 'none'
    }
  }
}

// function build_papers(papers, title) {
// 	var head = `<thead><td>pmid</td><td>title</td></thead>`
// 	var rows = [head]
// 	for (const p of papers) {
// 		rows.push(`<tr><td>${p.pmid}</td><td>${p.title}</td></tr>`)
// 	}
// 	var table = `<table>${rows.join('')}</table>`
// 	const papers_div = document.getElementById("papers")
// 	papers_div.innerHTML = table
// 	const papers_title = document.getElementById("papers-title")
// 	papers_title.innerText = title
// }


// const data = [
//       {
//                 "pair": "virus IL6",
//                 "first": "virus",
//                 "second": "IL6",
//                 "count": 11241
//             },
//       {
//                 "pair": "virus PDCD1",
//                 "first": "virus",
//                 "second": "PDCD1",
//                 "count": 1070
//             },
//       {
//                 "pair": "virus TIMP4",
//                 "first": "virus",
//                 "second": "TIMP4",
//                 "count": 18
//             }
// ]

// const papers = [
//     {
//         "year": "2021-01-01",
//         "journal": "1. Viruses. 2021 Aug 11;13(8):1588. doi: 10.3390/v13081588.",
//         "title": "Coxsackievirus A2 Leads to Heart Injury in a Neonatal Mouse Model.",
//         "authors": "Ji W(1), Zhu P(1), Liang R(1), Zhang L(1), Zhang Y(1), Wang Y(1), Zhang W(2), \nTao L(3), Chen S(1), Yang H(1), Jin Y(1), Duan G(1)(4).",
//         "institutions": "Author information:\n(1)Department of Epidemiology, College of Public Health, Zhengzhou University, \nZhengzhou 450001, China.\n(2)Department of Immunology, Duke University Medical Center, Durham, NC 27710, \nUSA.\n(3)School of Public Health, Xinxiang Medical University, Xinxiang 453003, China.\n(4)Henan Key Laboratory of Molecular Medicine, Zhengzhou University, Zhengzhou \n450001, China.",
//         "abstract": "Coxsackievirus A2 (CVA2) has emerged as an active pathogen that has been \nimplicated in hand, foot, and mouth disease (HFMD) and herpangina outbreaks \nworldwide. It has been reported that severe cases with CVA2 infection develop \ninto heart injury, which may be one of the causes of death. However, the \nmechanisms of CVA2-induced heart injury have not been well understood. In this \nstudy, we used a neonatal mouse model of CVA2 to investigate the possible \nmechanisms of heart injury. We detected CVA2 replication and apoptosis in heart \ntissues from infected mice. The activity of total aspartate transaminase (AST) \nand lactate dehydrogenase (LDH) was notably increased in heart tissues from \ninfected mice. CVA2 infection also led to the disruption of cell-matrix \ninteractions in heart tissues, including the increases of matrix \nmetalloproteinase (MMP)3, MMP8, MMP9, connective tissue growth factor (CTGF) and \ntissue inhibitors of metalloproteinases (TIMP)4. Infiltrating leukocytes (CD45+ \nand CD11b+ cells) were observed in heart tissues of infected mice. \nCorrespondingly, the expression levels of inflammatory cytokines in tissue \nlysates of hearts, including tumor necrosis factor alpha (TNF-α), \ninterleukin-1beta (IL-1β), IL6 and monocyte chemoattractant protein-1 (MCP-1) \nwere significantly elevated in CVA2 infected mice. Inflammatory signal pathways \nin heart tissues, including phosphatidylinositol 3-kinase (PI3K)-AKT, \nmitogen-activated protein kinases (MAPK) and nuclear factor kappa B (NF-κB), \nwere also activated after infection. In summary, CVA2 infection leads to heart \ninjury in a neonatal mouse model, which might be related to viral replication, \nincreased expression levels of MMP-related enzymes and excessive inflammatory \nresponses.",
//         "pmid": "34452454"
//     },
//     {
//         "year": "2016-01-01",
//         "journal": "2. Virus Genes. 2016 Apr;52(2):172-8. doi: 10.1007/s11262-015-1270-1. Epub 2016\nJan  19.",
//         "title": "Human heart cell proteins interacting with a C-terminally truncated 2A protein \nof coxsackie B3 virus: identification by the yeast two-hybrid system.",
//         "authors": "Zhao T(1), Huang X(2), Xia Y(3).",
//         "institutions": "Author information:\n(1)School of Pharmacy, Nanchang University, Nanchang, 330006, Jiangxi, China.\n(2)Department of Medical Microbiology, School of Medicine, Nanchang University, \nNanchang, 330006, Jiangxi, China.\n(3)Department of Medical Microbiology, School of Medicine, Nanchang University, \nNanchang, 330006, Jiangxi, China. xiayanhua@ncu.edu.cn.",
//         "abstract": "Protein 2A is a non-structural protein of coxsackievirus B3 (CVB3), an important \nhuman pathogen that can cause a variety of human diseases. Protein 2A not only \nparticipates in viral life cycle, but also regulates host cell functions; \nhowever, the underlying mechanisms remain poorly understood. In order to better \nunderstand the molecular mechanisms of CVB3 2A's function, the yeast two-hybrid \n(Y2H) system was adopted to screen for CVB3 2A interactive proteins in the human \nheart cDNA library. Full-length 2A shows strong transcriptional activity in \nyeast cells, which interferes with the application of Y2H system; therefore, a \nseries of 2A deletion mutants were constructed. Analysis of transcriptional \nself-activation revealed that 2A lost its transcriptional activity after \ntruncation of 60 amino acids (aa) at the N-terminus or deletion of 17 aa at the \nC-terminus. Choosing the 2A mutant with 17 aa deletion at the C-terminus as the \nbait protein, four interactive cellular proteins were identified, including \nTIMP4, MYL2, COX7C, and ENO1. These proteins are mostly related to protein \ndegradation and metabolism. Although the interactions detected by the Y2H system \nshould be considered as preliminary results, the finding of proteins translated \nfrom a human heart cDNA library that interacts with the CVB3 2A will stimulate \nexperiments testing the reactivity of a translational mixture derived from that \nlibrary with full-length 2A protein, followed by co-immunoprecipitation studies.",
//         "pmid": "26781950"
//     },
//     {
//         "year": "2016-01-01",
//         "journal": "3. Eur J Paediatr Neurol. 2016 Mar;20(2):252-260. doi:\n10.1016/j.ejpn.2015.12.006.  Epub 2015 Dec 23.",
//         "title": "Inflammatory markers in pediatric stroke: An attempt to better understanding the \npathophysiology.",
//         "authors": "Buerki SE(1), Grandgirard D(2), Datta AN(3), Hackenberg A(4), Martin F(5), \nSchmitt-Mechelke T(6), Leib SL(7), Steinlin M(8); Swiss Neuropediatric Stroke \nRegistry Study Group.",
//         "institutions": "Author information:\n(1)Division of Neurology, Department of Pediatrics, Children's Hospital and \nUniversity of British Columbia, Canada; Department of Neuropediatrics, \nDevelopment and Rehabilitation, University Children's Hospital, Inselspital, \nBerne, Switzerland. Electronic address: sarah.buerki@cw.bc.ca.\n(2)Institute for Infectious Diseases, University of Bern, Neuroinfectiology \nLaboratory, Institute for Infectious Diseases, Postfach 8571, CH-3001 Bern, \nSwitzerland.\n(3)University Children's Hospital Basel, Universitäts-Kinderspital beider Basel, \nSpitalstrasse 33, CH-4056 Basel, Switzerland.\n(4)University Children's Hospital Zürich, Kinderspital Zürich, University \nChildren's Hospital Zürich, Steinwiesstrasse 75, CH-8032 Zürich, Switzerland.\n(5)Children's Hospital Winterthur, Kantonsspital Winterthur, Brauerstrasse 15, \nPostfach 834, CH-8401 Winterthur, Switzerland.\n(6)Children's Hospital Lucerne, Luzerner Kantonsspital, Kinderspital Luzern, \nCH-6000 Luzern 16, Switzerland.\n(7)Institute for Infectious Diseases, University of Bern, Neuroinfectiology \nLaboratory, Institute for Infectious Diseases, Postfach 8571, CH-3001 Bern, \nSwitzerland; Biology Division, Spiez Laboratory, Swiss Federal Office for Civil \nProtection, Spiez, Switzerland.\n(8)Department of Neuropediatrics, Development and Rehabilitation, University \nChildren's Hospital, Inselspital, Berne, Switzerland.",
//         "abstract": "Comment in\n    Pediatr Neurol Briefs. 2016 Nov;30(11):41.",
//         "pmid": "26778232"
//     },
//     {
//         "year": "2015-01-01",
//         "journal": "4. Clin Exp Immunol. 2015 Nov;182(2):213-9. doi: 10.1111/cei.12686. Epub 2015 Sep\n 11.",
//         "title": "The effect of gender and genetic polymorphisms on matrix metalloprotease (MMP) \nand tissue inhibitor (TIMP) plasma levels in different infectious and \nnon-infectious conditions.",
//         "authors": "Collazos J(1), Asensi V(2), Martin G(3), Montes AH(4), Suárez-Zarracina T(2), \nValle-Garay E(4).",
//         "institutions": "Author information:\n(1)Infectious Diseases, Hospital De Galdacano, Vizcaya.\n(2)Infectious Diseases, Hospital Universitario Central de Asturias (HUCA), \nOviedo University School of Medicine, Oviedo, Spain.\n(3)Critical Care, Hospital Universitario Central de Asturias (HUCA), Oviedo \nUniversity School of Medicine, Oviedo, Spain.\n(4)Biochemistry and Molecular Biology, Hospital Universitario Central de \nAsturias (HUCA), Oviedo University School of Medicine, Oviedo, Spain.",
//         "abstract": "Matrix metalloproteases (MMPs) are increased in different infections due to \ntheir role in controlling immune responses and are regulated by tissue \ninhibitors (TIMPs). Different MMP promoter single nucleotide polymorphisms \n(SNPs) induce changes in MMP genes, mRNA and protein expression. Gender might \nalso modify MMP plasma levels. In order to determine the weight of these \nvariables on MMP secretion we studied MMP-1, -2, -3, -8, -9, -10, -13 and \nTIMP-1, -2, -4 plasma levels in 90 patients with severe bacterial sepsis, 102 \nwith anti-retroviral (ARV)-treated HIV monoinfection, 111 with ARV-treated \nHIV-hepatitis C virus (HCV) co-infection and 86 non-infected controls (45 stroke \nand 41 trauma patients). MMP-1(-1607 1G/2G), MMP-3(-1612 5A/6A), MMP-8(-799C/T), \nMMP-9(-1562 C/T) and MMP-13(-77A/G) SNPs were genotyped. MMP-3 plasma levels \nwere significantly higher in men than in women in each diagnostic group, and \nMMP-3 SNP allele 6A carriers also had higher levels than allele 5A carriers, an \neffect that was magnified by sepsis. Independent predictors of higher MMP-3 \nlevels were male gender (P = 0.0001), MMP-3(-1612 5A/6A) SNP (P = 0.001), higher \nlevels of TIMP-4 (P = 0.004) and MMP-8 (P = 0.006) and lower levels of MMP-1 (P \n= 0.03) by multivariate analysis. No strong associations with gender or SNPs \nwere observed for other MMPs or TIMPs. In conclusion, male gender and \nMMP-3(-1612 5A/6A) 6A allele carriage increased MMP-3 plasma levels \nsignificantly, especially in patients with severe bacterial sepsis. This \nconfounding gender effect needs to be addressed when evaluating MMP-3 plasma \nlevels in any infectious or non-infectious condition.",
//         "pmid": "26206176"
//     },
//     {
//         "year": "2014-01-01",
//         "journal": "5. Circ Res. 2014 Apr 25;114(9):1435-45. doi: 10.1161/CIRCRESAHA.114.303634. Epub\n 2014 Mar 17.",
//         "title": "Targeted overexpression of tissue inhibitor of matrix metalloproteinase-4 \nmodifies post-myocardial infarction remodeling in mice.",
//         "authors": "Zavadzkas JA(1), Stroud RE, Bouges S, Mukherjee R, Jones JR, Patel RK, McDermott \nPJ, Spinale FG.",
//         "institutions": "Author information:\n(1)From the Department of Surgery (J.A.Z., R.E.S., S.B., R.M., J.R.J., R.K.P.), \nand Department of Medicine (P.J.M.), Medical University of South Carolina, \nCharleston; Ralph H. Johnson Veteran's Affairs Medical Center, Charleston, SC \n(J.A.Z., R.E.S., S.B., R.M., J.R.J., R.K.P., P.J.M.); Department of Cell Biology \n& Anatomy and Surgery, University of South Carolina School of Medicine, Columbia \n(F.G.S.); and WJB Dorn VA Medical Center, Columbia, SC (F.G.S.).",
//         "abstract": "RATIONALE: Myocardial infarction (MI) causes an imbalance between matrix \nmetalloproteinases and tissue inhibitors of matrix metalloproteinases (TIMPs) \nand is associated with adverse left ventricular (LV) remodeling. A uniform \nreduction in TIMP-4 post-MI has been observed.\nOBJECTIVE: To examine post-MI remodeling with cardiac-restricted overexpression \nof TIMP-4, either through a transgenic or viral delivery approach.\nMETHODS AND RESULTS: MI was induced in mice and then randomized to targeted \ninjection of an adenoviral construct (10 μL; 8×10(9) plaque forming units/mL) \nencoding green fluorescent protein (GFP) and the full-length human TIMP-4 \n(Ad-GFP-TIMP4) or GFP. A transgenic construct with cardiac-restricted \noverexpression TIMP-4 (hTIMP-4exp) was used in a parallel set of studies. LV \nend-diastolic volume, an index of LV remodeling, increased by >60% from baseline \nat 5 days post-MI and by >100% at 21 days post-MI in the Ad-GFP only group. \nHowever, LV dilation was reduced by ≈50% in both the Ad-GFP-TIMP4 and hTIMP-4exp \ngroups at these post-MI time points. LV ejection fraction was improved with \neither Ad-GFP-TIMP-4 or hTIMP-4exp. Fibrillar collagen expression and content \nwere increased within the MI region with both TIMP-4 interventions, suggestive \nof matrix stabilization.\nCONCLUSIONS: This study is the first to demonstrate that selective myocardial \ntargeting for TIMP-4 induction through either a viral or transgenic approach \nfavorably altered the course of adverse LV remodeling post-MI. Thus, localized \ninduction of endogenous matrix metalloproteinase inhibitors, such as TIMP-4, \nholds promise as a means to interrupt the progression of post-MI remodeling.",
//         "pmid": "24637197"
//     },
//     {
//         "year": "2011-01-01",
//         "journal": "6. Cytokine. 2011 May;54(2):109-16. doi: 10.1016/j.cyto.2011.02.007. Epub 2011\nFeb  26.",
//         "title": "Expression of matrix metalloproteinases and their tissue inhibitors in the serum \nand cerebrospinal fluid of patients with HIV-1 infection and syphilis or \nneurosyphilis.",
//         "authors": "Tsai HC(1), Ye SY, Kunin CM, Lee SS, Wann SR, Tai MH, Shi MH, Liu YC, Chen YS.",
//         "institutions": "Author information:\n(1)Department of Medicine, Kaohsiung Veterans General Hospital, Kaohsiung, \nTaiwan.",
//         "abstract": "The potential mechanisms for altered matrix metalloproteinase (MMP) or tissue \ninhibitors of matrix metalloproteinase (TIMP) function in patients with syphilis \nand HIV-1 co-infection (HIV-S) was unclear. To determine the expression of \nMMP-2, 9 and TIMP-1, 2, 4 in the serum and cerebrospinal fluid (CSF) of HIV-S \npatients, a total of 20 HIV-S patients and 8 controls were enrolled in a HIV-1 \nclinical cohort for diagnosis of neurosyphilis in Taiwan. Serum and CSF \nconcentrations of MMP-2, 9, and TIMP-1, 2, 4 were determined by ELISA. Gelatin \nzymography was used to detect the expression of MMP-2 and MMP-9 in the CSF. \nNeurosyphilis was defined as a CSF white blood cell count ≥ 20 cells/μL or a \nreactive CSF Venereal Disease Research Laboratory (VDRL). All the patients with \nHIV-S were males. Most (85%) had sex with men (MSM) and serum rapid plasma \nreagin (RPR) titers of ≥ 1:32. The median age was 35 years (IQR 30-43). The \nmedian CD4 T cell counts at the time of the diagnosis of syphilis were 270 \ncells/μL (IQR 96-484). Ten patients (50%) had neurosyphilis based on a reactive \nCSF VDRL test (n=8) or increased CSF white cell counts ≥ 20/μL (n=2). The \nconcentrations of CSF MMP-9, TIMP-1, and TIMP-2 were significantly higher in \npatients with HIV-S than the controls (P<0.05). The CSF TIMP-4 concentrations \nwere significantly lower in those with HIV-S (452 pg/ml) than controls (3101 \npg/ml), P<0001. There were no significant differences in serum concentrations \nbetween the groups. The only finding that distinguished HIV-1 patients with from \nthose without neurosyphilis is a significant higher expression of CSF MMP-9. In \nconclusion, the MMP/TIMP system was found to be dysregulated in patients with \nHIV-S regardless of whether they met the laboratory definition of neurosyphilis. \nThe CSF level of MMP-9 was the only measure that distinguished those with or \nwithout neurosyphilis.",
//         "pmid": "21354815"
//     },
//     {
//         "year": "2010-01-01",
//         "journal": "7. AIDS. 2010 Oct 23;24(16):2499-506. doi: 10.1097/QAD.0b013e32833e922c.",
//         "title": "The MMP1 (-16071G/2G) single nucleotide polymorphism associates with the \nHAART-related lipodystrophic syndrome.",
//         "authors": "Montes AH(1), Valle-Garay E, Suarez-Zarracina T, Melon S, Martinez E, Carton JA, \nCollazos J, Asensi V.",
//         "institutions": "Author information:\n(1)Department of Biochemistry and Molecular Biology, Hospital Universitario \nCentral de Asturias, Oviedo University School of Medicine, Oviedo, Spain.",
//         "abstract": "OBJECTIVE: Matrix metalloproteinases (MMPs) and their tissue inhibitors (TIMPs) \nare involved in extracellular matrix remodelling and adipocyte differentiation \nand are inhibited by antiretrovirals. MMPs and TIMPs and their single nucleotide \npolymorphisms (SNPs) might contribute to the HAART-related lipodystrophic \nsyndrome pathogenesis.\nDESIGN AND SETTING: Cross-sectional study in a university-based outpatient \nclinic.\nPATIENTS AND METHODS: Two hundred and sixteen HIV-infected patients on extended \nHAART were studied. Serum MMPs (1, 2, 3, 8, 9, 10, 13) and TIMPs (1, 2, 4) were \nmeasured by ELISA microarrays. MMP1 (-16071G/2G) SNP was also genotyped. \nLipodystrophic syndrome was diagnosed by a clinical scale validated by fat dual \nenergy X-ray absorptiometry.\nRESULTS: Eighty-two patients (38.0%) showed lipodystrophic syndrome, mostly \nlipoatrophy. The 2G/2G MMP1 SNP genotype was more frequent among lipodystrophic \nsyndrome patients (41.3 vs. 20.5%, odds ratio, 2.73; 95% confidence interval, \n1.41-5.29; χ² = 9.62, P = 0.002 for HIV-infected patients with and without \nlipodystrophic syndrome respectively). Carriers of this genotype had higher \nserum levels of MMP1 compared with those with the 1G/1G (P = 0.02). Higher MMP1 \n(P = 0.022) and lower TIMP4 (P = 0.038) serum levels were observed while \ncomparing HIV patients with and without lipodystrophic syndrome. MMP1 2G \ncarriage (P = 0.0008), TIMP4 lower serum levels (P = 0.02), treatment with \nstavudine (P < 0.0001), treatment with zidovudine (P = 0.006) and absence of \nhepatitis C virus coinfection (P = 0.002) were associated with lipodystrophic \nsyndrome by logistic regression.\nCONCLUSION: MMP1 SNP, which induced increased serum levels of this protein, was \nassociated with lipodystrophic syndrome.",
//         "pmid": "20852404"
//     },
//     {
//         "year": "2010-01-01",
//         "journal": "8. J Surg Res. 2010 Apr;159(2):611-7. doi: 10.1016/j.jss.2009.10.038. Epub 2009\nNov  20.",
//         "title": "Differential expression of hepatic fibrosis mediators in sick and spontaneously \nrecovered mice with experimental biliary atresia.",
//         "authors": "Nadler EP(1), Li X, Onyedika E, Greco MA.",
//         "institutions": "Author information:\n(1)Department of Surgery, Division of Pediatric Surgery, New York University \nSchool of Medicine, New York, New York. enadler@cnmc.org <enadler@cnmc.org>",
//         "abstract": "BACKGROUND: Hepatic fibrosis leading to cirrhosis is the major morbidity in \npatients with biliary atresia (BA). This fibrosis is due to an imbalance in \nextracellular matrix (ECM) breakdown and deposition. We have previously \ndemonstrated increased mRNA expression for inhibitors of ECM breakdown without \nincreased expression for mediators of ECM deposition in our animal model of BA \nby d 14. However, only a mild degree of hepatic fibrosis was seen at this time. \nWe hypothesized that expression patterns for these proteins may change once more \nsignificant fibrosis had been established, and added resuscitation to the model \nto improve survival. Interestingly, we found that some mice spontaneously \nrecovered at later time points with resuscitation, and thus compared expression \nfor inhibitors of ECM breakdown and deposition in sick and recovered mice to \ndetermine the differences.\nMETHODS: Newborn Balb/c mice received an intraperitoneal injection 1.0 x 10(6) \nfluorescence forming units of rhesus rotavirus 24h after birth. Mice were \nmonitored daily for weight gain, development of jaundice, acholic stools, and \nbilirubinuria. Fifty muL/g of 5% dextrose in normal saline were subcutaneously \ninjected daily to each mouse starting on d 7 until sacrifice. Mice that survived \npast d 14 were sacrificed at d 21 after saline or RRV infection. Livers were \nthen harvested post-injection d 21 for histologic and immunohistochemical \nanalysis. RNA expression of known mediators of fibrosis was evaluated using \nquantitative real-time PCR. Protein expression was assessed using ELISA. Weights \nand normally distributed data were compared using Student's t test. Histologic \nfindings were compared using Fisher's exact test. Comparisons of gene expression \nand skewed data were performed by the Mann-Whitney U test. Statistical \nsignificance was assigned to any P value less than 0.05.\nRESULTS: Daily resuscitation resulted in a 35% (24/68) survival rate to d 21 in \nour model. Mice that recovered were significantly heavier than those that \nremained ill on d 14 (6.15 +/- 1.16 versus 4.94 +/- 0.82, P = 0.02) and 21 (7.31 \n+/- 1.41 versus 4.14 +/- 0.53, P < 0.001) despite the fact that there was no \ndifference between the groups with respect to weight on d 7 (4.29 +/- 0.90 \nversus 3.89 +/- 0.81, P = 0.32). We found that all (10/10) animals that \ndisplayed clinical signs of biliary atresia on d 21 had moderate or severe \nhistologic findings, while only one (1/9) of the recovered animals had liver \nabnormalities at sacrifice (P < 0.001 versus sick group). We also found that the \nsick mice had statistically significant median fold-increases of mRNA expression \nfor TIMP-1 (31.9 versus 9.1, P = 0.041), TIMP-4 (88.1 versus 1.8, P = 0.022), \nand MMP-7 (51.8 versus 11.9, P = 0.006) compared with those that recovered. \nThere was a trend toward decreased mRNA expression for PAI-1, which did not \nreach statistical significance (median 27.7 versus 2.19, P = 0.066). Increased \nprotein expression for TIMP-1 and PAI-1 were also found in the sick group. The \nmRNA expression for the fibrillar collagens, fibronectin-1, connective tissue \ngrowth factor, snail-1, TIMP-2 and -3, and MMP-2 and MMP-9 was not different in \nthe sick and recovered groups 21 d after RRV infection, and was not elevated \nfrom baseline gene expression.\nCONCLUSIONS: With resuscitation added to the animal model of BA, some mice \nspontaneously recover while others progress to more significant hepatic \nfibrosis. Mice with hepatic fibrosis have a continued increase in mRNA \nexpression of TIMP-1, TIMP-4, and MMP-7, with a trend toward increased mRNA \nexpression of PAI-1 on d 21. Protein levels for TIMP-1 and PAI-1 were also \nincreased in the sick mice. Recovered mice display mild to no hepatic \nparenchymal disease and a normal pattern of mRNA expression for the mediators of \nfibrosis tested. No increase in mRNA expression for the mediators of ECM \ndeposition was found in either group. These data further support the notion that \ninhibition of ECM breakdown alone is sufficient to induce hepatic fibrosis. \nModulation of this process may be a putative target for preventing liver injury \nin patients with BA.",
//         "pmid": "20097372"
//     },
//     {
//         "year": "2009-01-01",
//         "journal": "9. J Surg Res. 2009 Jun 1;154(1):21-9. doi: 10.1016/j.jss.2008.05.023. Epub 2008 \nJun 20.",
//         "title": "Integrin alphavbeta6 and mediators of extracellular matrix deposition are \nup-regulated in experimental biliary atresia.",
//         "authors": "Nadler EP(1), Patterson D, Violette S, Weinreb P, Lewis M, Magid MS, Greco MA.",
//         "institutions": "Author information:\n(1)Division of Pediatric Surgery, Department of Surgery, New York University \nSchool of Medicine, New York, New York 10016, USA. evan.nadler@med.nyu.edu",
//         "abstract": "INTRODUCTION: Biliary atresia (BA) is a progressive obliteration of the \nextrahepatic bile ducts resulting in hepatic fibrosis. The underlying mechanisms \nhave not been defined. We used an animal model of BA to evaluate mediators of \nextracellular matrix (ECM) processing to determine which factors may be \ninvolved.\nMETHODS: Newborn BALB/c mice received an intraperitoneal injection with rhesus \nrotavirus or saline within 24 h of birth. Livers were harvested on days 7 and 14 \nfor histology and immunohistochemistry (IHC). RNA expression was determined \nusing quantitative real-time PCR. Human liver from patients with BA and those \nhaving a resection for nonfibrosing diseases was also evaluated.\nRESULTS: In experimental mice, mRNA expression for tissue inhibitor of \nmetalloproteinase (TIMP)-1 and matrix metalloproteinase (MMP)-7 was increased \n18-fold and 69-fold, respectively on day 7, with further increases on day 14. On \nday 14, mRNA expression for plasminogen activator inhibitor (PAI)-1 (38-fold), \nTIMP-4 (9.5-fold), and MMP-9 (5.5-fold) mRNA was also observed. Furthermore, \nintegrin alpha(v) beta(6) mRNA expression was increased on days 7 (11-fold) and \n14 (6-fold). Presence of integrin alpha(v) beta(6) protein was confirmed by IHC \nin both mouse and human specimens in the proliferating biliary epithelium.\nCONCLUSIONS: Our data suggest experimental BA is associated with increased mRNA \nexpression of ECM degradation inhibitors, TIMP-1, PAI-1, and TIMP-4. MMP-7 and \nMMP-9 expression is also elevated in this model. Furthermore, increased gene \nexpression of integrin alpha(v)beta(6) was demonstrated and IHC confirmed \nprotein expression. Integrin alpha(v)beta(6) or the inhibitors of ECM breakdown \nmay be attractive targets for future treatment strategies.",
//         "pmid": "19084240"
//     },
//     {
//         "year": "2006-01-01",
//         "journal": "10. Zhonghua Yi Xue Za Zhi. 2006 Feb 21;86(7):472-5.",
//         "title": "[Effects of tissue inhibitor of matrix metalloproteinases-4 on the activities of \nmatrix metalloproteinases and collagen of artery: experiment with rats].",
//         "authors": "[Article in Chinese]",
//         "institutions": "Zu LY(1), Guo YH, Chen L, Li Q, Yan H, Gao W.",
//         "abstract": "Author information:\n(1)Department of Cardiology, Peking University Third Hospital, Peking University \nInstitute of Cardiovascular Sciences, Beijing 100083, China.",
//         "pmid": "16677575"
//     },
//     {
//         "year": "2006-01-01",
//         "journal": "11. Cardiovasc Pathol. 2006 Mar-Apr;15(2):63-74. doi:\n10.1016/j.carpath.2005.11.008.",
//         "title": "Matrix metalloproteinases and tissue inhibitors of metalloproteinases in \ncoxsackievirus-induced myocarditis.",
//         "authors": "Cheung C(1), Luo H, Yanagawa B, Leong HS, Samarasekera D, Lai JC, Suarez A, \nZhang J, McManus BM.",
//         "institutions": "Author information:\n(1)Department of Pathology and Laboratory Medicine, James Hogg iCAPTURE Centre \nfor Cardiovascular and Pulmonary Research, St. Paul's Hospital/Providence Health \nCare, University of British Columbia, Vancouver, BC, Canada V6Z 1Y6.",
//         "abstract": "BACKGROUND: Coxsackievirus B3 (CVB3) is the major causative agent of myocarditis \nin humans. In the mouse model, the inflammatory phase of myocarditis results in \nextensive damage to the heart and triggers profound extracellular matrix (ECM) \nremodeling, which may ultimately lead to dilated cardiomyopathy. Matrix \nmetalloproteinases (MMPs) are regulators of the ECM and can degrade all the \ncomponents in the matrix.\nMETHODS: Adolescent male mice were infected with cardiovirulent CVB3 and \nsacrificed at 3, 9, and 30 days post infection (pi). Transcription of MMP-2, \nMMP-9, and MMP-12 was assessed by reverse-transcriptase polymerase chain \nreaction (RT-PCR). Protein expression of these enzymes was examined using \nimmunohistochemistry, and the activation status of MMP-2 and MMP-9 was assessed \nusing gelatin zymography. Tissue inhibitors of metalloproteinases (TIMPs) were \nanalyzed using immunoblotting assays. Myocarditic hearts were also stained with \npicrosirius red and viewed under polarizing light to examine the collagen \nnetwork.\nRESULTS: MMP-2, MMP-9, and MMP-12 transcription was increased at 9 days pi, as \ndetermined by RT-PCR. Immunohistochemistry confirmed an increase in translation \nof these MMP species, and zymographic analysis further showed elevated \nactivation of MMP-2 and MMP-9 following CVB3 infection. TIMP-3 and TIMP-4 \nexpression was down-regulated, while TIMP-1 and TIMP-2 remained constant \nthroughout the infection. Mouse hearts stained with picrosirius red showed an \nincrease in total amount of collagen during the acute phase of infection and \ndisrupted fibrils at later timepoints.\nCONCLUSION: After CVB3 infection, ECM remodeling is triggered, and this response \nmay involve increased expression and activation of MMPs.",
//         "pmid": "16533694"
//     },
//     {
//         "year": "2005-01-01",
//         "journal": "12. Eur J Heart Fail. 2005 Jun;7(4):444-52. doi: 10.1016/j.ejheart.2004.07.002.",
//         "title": "Carvedilol improves left ventricular function in murine coxsackievirus-induced \nacute myocarditis association with reduced myocardial interleukin-1beta and \nMMP-8 expression and a modulated immune response.",
//         "authors": "Pauschinger M(1), Rutschow S, Chandrasekharan K, Westermann D, Weitz A, Peter \nSchwimmbeck L, Zeichhardt H, Poller W, Noutsias M, Li J, Schultheiss HP, Tschope \nC.",
//         "institutions": "Author information:\n(1)Department of Internal Medicine II, Cardiology and Pneumonology, \nCharité-University Medicine Berlin, Campus Benjamin Franklin, Hindenburgdamm 30, \nD-12200 Berlin, Germany. pauschinger@ukbf.fu-berlin.de",
//         "abstract": "BACKGROUND: Proinflammatory cytokines induce the expression of matrix \nmetalloproteinases that play a crucial role in myocardial remodeling. \nBeta-adrenergic receptor stimulation influences the production of cytokines \nheralding the possibility of modulating cytokine production by beta-adrenergic \nblockers.\nMETHODS AND RESULTS: In a coxsackievirus B3 murine myocarditis model (BALB/c), \neffects of carvedilol and metoprolol on myocardial cytokine expression, \ninflammatory cell infiltration and MMP/TIMP profiles were investigated. In \ncarvedilol-treated mice, a significant improvement in left ventricular function \nwas documented 10 days post infection. In infected mice (n=10), IL-1beta, \nTNF-alpha, TGF-beta(1) and IL-10 myocardial mRNA abundance were increased \nsignificantly (240%, 200%, 161%, and 230%) compared to controls (n=10), while \nIL-15 mRNA was markedly reduced (70%). Infected mice showed significantly \nincreased infiltrations with CD3-, CD4- and CD8-T-lymphocytes (730%, 1110%, \n380%). In the infected mice, myocardial MMP/TIMP profiles presented a \nsignificant upregulation of membrane type-1 MMP, MMP-9, MMP-8 and MMP-3 (150%, \n160%, 340%, and 270%) and a significant decrease in TIMP-4 levels (75%). \nCarvedilol attenuated over-expression of myocardial TGF-beta(1), IL-1beta and \nMMP-8 mRNA expression significantly and induced a relevant IL-10 mRNA expression \nin the infected mice (n=10). By an unchanged infiltration with \nCD3-T-lymphocytes, carvedilol showed a representative reduction in \nCD4-T-lymphocytes.\nCONCLUSION: Carvedilol treatment in experimental myocarditis leads to reduced \nexpression of proinflammatory cytokines and MMPs, which contributes to reduced \nmatrix degradation and ultimately to improved structural integrity of the heart. \nBesides the antiadrenergic potential, carvedilol is beneficial due to a wide \nrange of biological activities (antiinflammatory, antifibrotic, antioxidative \nand immunomodulatory).",
//         "pmid": "15921778"
//     },
//     {
//         "year": "2003-01-01",
//         "journal": "13. Beijing Da Xue Xue Bao Yi Xue Ban. 2003 Aug;35(4):434-7.",
//         "title": "[Adenovirus-mediated transfer of TIMP-4 gene inhibits neointimal formation after \nballoon injury].",
//         "authors": "[Article in Chinese]",
//         "institutions": "Guo Y(1), Li Q, Chen G, Tang J, Gao W.",
//         "abstract": "Author information:\n(1)Department of Cardiology, Peking University First Hospital, Beijing 100034, \nChina.",
//         "pmid": "12947565"
//     },
//     {
//         "year": "2003-01-01",
//         "journal": "14. Life Sci. 2003 May 9;72(25):2863-76. doi: 10.1016/s0024-3205(03)00146-2.",
//         "title": "TIMPs and MMPs expression in CSF from patients with TSP/HAM.",
//         "authors": "Kettlun AM(1), Cartier L, García L, Collados L, Vásquez F, Ramírez E, Valenzuela \nMA.",
//         "institutions": "Author information:\n(1)Departamento de Bioquímica y Biología Molecular, Facultad de Ciencias \nQuímicas y Farmacéuticas, Universidad de Chile, Casilla 233 Correo 1, Santiago, \nChile.",
//         "abstract": "The tropical spastic paraparesis or human T-cell lymphotropic virus associated \nmyelopathy (TSP/HAM), has been related with an overexpression of matrix \nmetalloproteinases (MMPs), especially MMP-9. Initial studies of reverse \nzymography with cerebrospinal fluid (CSF) from TSP/HAM patients, and controls \nshowed the presence of TIMPs, endogenous MMP inhibitors. We determined in CSF \nthe levels of TIMPs by immunoanalysis in 25 patients with TSP/HAM, and compared \nwith two groups: controls and patients with acute and subacute inflammatory \nneurological diseases. We found that TIMP-2, TIMP-3 and TIMP-4 levels were \nsignificantly higher than in controls in both TSP/HAM and inflammatory patients, \nwhile TIMP-1 was increased only in the inflammatory group. Levels of MMP-3 and \nMMP-9 from the two groups of patients showed a significant upregulation in CSF. \nIn the CSF of around the 70% of TSP-HAM and inflammatory patients the presence \nMMP-9 was detected by zymography, but not in controls. MMP-2 was only \noverexpressed in the acute inflammatory group. The active form of MMP-2 was \nobserved in both groups of patients with a similar high frequency (60%). MMPs \noverexpressions are independent of the evolution time of the disease in TSP/HAM. \nThe chronic overexpression of these extracelullar matrix proteins detected in \nCSF of TSP/HAM should be indirectly produced by secreted viral proteins being \nresponsible for the progression of this disease, accounting for the observed \ndifferences with acute inflammatory patients. Our results support the existence \nof an imbalance between MMPs and their endogenous tissue inhibitors, which could \nbe a pathogenic factor in the chronicity of TSP/HAM.",
//         "pmid": "12697269"
//     },
//     {
//         "year": "2002-01-01",
//         "journal": "15. Cardiovasc Res. 2002 Nov;56(2):235-47. doi: 10.1016/s0008-6363(02)00546-1.",
//         "title": "Collagen degradation in a murine myocarditis model: relevance of matrix \nmetalloproteinase in association with inflammatory induction.",
//         "authors": "Li J(1), Schwimmbeck PL, Tschope C, Leschka S, Husmann L, Rutschow S, \nReichenbach F, Noutsias M, Kobalz U, Poller W, Spillmann F, Zeichhardt H, \nSchultheiss HP, Pauschinger M.",
//         "institutions": "Author information:\n(1)Department of Internal Medicine II, University Hospital Benjamin Franklin, \nFree University Berlin, Hindenburgdamm 30, D-12200, Berlin, Germany.",
//         "abstract": "OBJECTIVE: Myocardial collagen degradation is regulated by matrix \nmetalloproteinases (MMPs) and tissue inhibitors of matrix metalloproteinase \n(TIMPs). The possible relevance of MMPs in association with the inflammatory \ninduction was investigated in a murine coxsackievirus B3 myocarditis model.\nMETHODS: Hearts from viral infected and sham-infected BALB/c mice were analyzed \nby semi-quantitative RT-PCR, picrosirius red staining, Western blot analysis, \nand immunohistochemistry.\nRESULTS: In viral infected mice, both mRNA and protein abundance for collagen \ntype I remained unaltered. In addition, picrosirius red staining showed the \nunchanged total collagen content. However, degraded soluble fraction of collagen \ntype I protein was increased. Moreover, the mRNA abundance for MMP-3 and MMP-9 \nwas upregulated, whereas the mRNAs for TIMP-1 and TIMP-4 were downregulated, \nrespectively. The upregulation of MMP-3/MMP-9 and downregulation of TIMP-4 were \nconfirmed at the protein level, and were associated with significantly increased \nmRNA levels of interleukin 1beta, tumor necrosis factor-alpha, transforming \ngrowth factor-beta1 and interleukin-4.\nCONCLUSION: The increment of MMPs in the absence of counterbalance by TIMPs may \nlead to a functional defect of the myocardial collagen network by \nposttranslational mechanisms. This may contribute significantly to the \ndevelopment of left ventricular dysfunction in murine viral myocarditis. The \ninflammatory response with induction of cytokines may mediate the dysregulation \nof the myocardial MMP/TIMP systems.",
//         "pmid": "12393094"
//     },
//     {
//         "year": "2001-01-01",
//         "journal": "16. Biochem Biophys Res Commun. 2001 Feb 16;281(1):126-30. doi: \n10.1006/bbrc.2001.4323.",
//         "title": "Differential roles of TIMP-4 and TIMP-2 in pro-MMP-2 activation by MT1-MMP.",
//         "authors": "Hernandez-Barrantes S(1), Shimura Y, Soloway PD, Sang QA, Fridman R.",
//         "institutions": "Author information:\n(1)Department of Pathology, Wayne State University, Detroit, Michigan 48201, \nUSA.",
//         "abstract": "The tissue inhibitors of metalloproteinases (TIMPs) are specific inhibitors of \nMMP enzymatic activity. However, TIMP-2 can promote the activation of pro-MMP-2 \nby MT1-MMP. This process is mediated by the formation of a complex between \nMT1-MMP, TIMP-2, and pro-MMP-2. Binding of TIMP-2 to active MT1-MMP also \ninhibits the autocatalytic turnover of MT1-MMP on the cell surface. Thus, under \ncertain conditions, TIMP-2 is a positive regulator of MMP activity. TIMP-4, a \nclose homologue of TIMP-2 also binds to pro-MMP-2 and can potentially \nparticipate in pro-MMP-2 activation. We coexpressed MT1-MMP with TIMP-4 and \ninvestigated its ability to support pro-MMP-2 activation. TIMP-4, unlike TIMP-2, \ndoes not promote pro-MMP-2 activation by MT1-MMP. However, TIMP-4 binds to \nMT1-MMP inhibiting its autocatalytic processing. When coexpressed with TIMP-2, \nTIMP-4 competitively reduced pro-MMP-2 activation by MT1-MMP. A balance between \nTIMP-2 and TIMP-4 may be a critical factor in determining the degradative \npotential of cells in normal and pathological conditions.",
//         "pmid": "11178970"
//     },
//     {
//         "year": "2001-01-01",
//         "journal": "17. J Cell Biochem. 2001;80(4):512-21. doi: \n10.1002/1097-4644(20010315)80:4<512::aid-jcb1005>3.0.co;2-n.",
//         "title": "Tissue inhibitor of metalloproteinase-4 instigates apoptosis in transformed \ncardiac fibroblasts.",
//         "authors": "Tummalapalli CM(1), Heath BJ, Tyagi SC.",
//         "institutions": "Author information:\n(1)Department of Physiology and Biophysics, The University of Mississippi \nMedical Center, 2500 North State Street, Jackson, MS 39216, USA.",
//         "abstract": "Tumor cells become malignant, in part, because of their activation of matrix \nmetalloproteinases (MMPs) and inactivation of tissue inhibitor of \nmetalloproteinases (TIMPs). Myocardial tumors are rarely malignant. This raises \nthe possibility that the MMPs and TIMPs are differentially regulated in the \nheart compared to other tissues. Therefore, we hypothesized that a tissue \nspecific tumor suppressor exists in the heart. To test this hypothesis we \nprepared cardiac tissue extracts from normal (n = 4), ischemic cardiomypathic \n(ICM) [n = 5], and dilated cardiomyopathic (DCM) [n = 8] human heart end-stage \nexplants. The level of cardiospecific TIMP-4 was determined by SDS-PAGE and \nWestern-blot analysis. The results suggested reduced levels of TIMP-4 in ICM and \nDCM as compared to normal heart. TIMP-4 was purified by reverse phase HPLC and \ngelatin-sepharose affinity chromatography. Collagenase inhibitory activity of \nchromatographic peaks was determined using fluorescein-conjugated collagen as \nsubstrate and fluorescence spectroscopy. The activity of TIMP-4 (27 kDa) was \ncharacterized by reverse zymography. The role of TIMP-4 in cardiac fibroblast \ncell migration was examined using Boyden chamber analysis. The results suggested \nthat TIMP-4 inhibited cardiac fibroblast cells migration and collagen gel \ninvasion. To test whether TIMP-4 induces apoptosis, we cultured cardiac normal \nand polyomavirus transformed fibroblast cells in the presence and absence of \nTIMP-4. The number of cells were measured and DNA laddering was determined. The \nresults suggested that TIMP-4 controlled normal cardiac fibroblast \ntransformation and induced apoptosis in transformed cells. Cardiospecific TIMP-4 \nplays a significant role in regulating the normal cell phenotype. The reduced \nlevels of TIMP-4 elicit cellular transformation and may lead to adverse \nextracellular matrix degradation (remodeling), cardiac hypertrophy and failure. \nThis study suggests a possible protective role of TIMP-4 in other organs which \nare susceptible to malignancy.",
//         "pmid": "11169735"
//     },
//     {
//         "year": "1999-01-01",
//         "journal": "18. Dev Biol. 1999 Jul 15;211(2):238-54. doi: 10.1006/dbio.1999.9313.",
//         "title": "Timp-1 is important for epithelial proliferation and branching morphogenesis \nduring mouse mammary development.",
//         "authors": "Fata JE(1), Leco KJ, Moorehead RA, Martin DC, Khokha R.",
//         "institutions": "Author information:\n(1)Department of Medical Biophysics, Ontario Cancer Institute, Toronto, Ontario, \nM5G 2M9, Canada.",
//         "abstract": "The dynamic process of mammary ductal morphogenesis depends on regulated \nepithelial proliferation and extracellular matrix (ECM) turnover. Epithelial \ncell-matrix contact closely dictates epithelial proliferation, differentiation, \nand survival. Despite the fact that tissue inhibitors of metalloproteinases \n(Timps) regulate ECM turnover, their function in mammary morphogenesis is \nunknown. We have delineated the spatiotemporal expression of all Timps (Timp-1 \nto Timp-4) during discrete phases of murine mammary development. Timp mRNAs were \nabundant in mammary tissue, each displaying differential expression patterns \nwith predominant localization in luminal epithelial cells. Timp-1 mRNA was \nunique in that its expression was limited to the stage at which epithelial \nproliferation was high. To assess whether Timp-1 promotes or inhibits epithelial \ncell proliferation we manipulated mammary Timp-1 levels, genetically and \nbiochemically. Down-regulation of epithelial-derived Timp-1 in transgenic mice, \nby mouse mammary tumor virus promoter-directed Timp-1 antisense RNA expression, \nled to augmented ductal expansion and increased number of ducts (P < 0.004). In \nthese transgenics the integrity of basement membrane surrounding epithelial \nducts, as visualized by laminin-specific immunostaining, was breached. In \ncontrast to these mice, ductal expansion was markedly attenuated in the \nproximity of implanted recombinant Timp-1-releasing pellets (rTIMP-1), without \nan increase in basement membrane deposition around migrating terminal end buds. \nEpithelial proliferation and apoptosis were measured to determine the basis of \naltered ductal expansion. Luminal epithelial proliferation was increased by 55% \n(P < 0.02) in Timp-1-reduced transgenic mammary tissue and, conversely, \ndecreased by 38% (P < 0.02) in terminal end buds by implanted rTIMP-1. \nEpithelial apoptosis was minimal and remained unaffected by Timp-1 \nmanipulations. We conclude that Timps have an integral function in mammary \nmorphogenesis and that Timp-1 regulates mammary epithelial proliferation in \nvivo, at least in part by maintaining basement membrane integrity.",
//         "pmid": "10395785"
//     }
// ]

// const plot = Plot.plot({
//   marginTop: 0,
//   marginLeft: 4,
//   x: {
//     padding: 0.4, ticks: 4, label: "Pubmed Results"
//   },
//   marks: [
//     Plot.barX(data, {
//       x: "count",
//       y: "pair",
//       fill: "#eee",
//       tip: true
//     }),
//     Plot.axisY({
//       tickSize: 0,
//       textAnchor: "start",
//       fill: "black",
//       dx: 14,
//       label: null
//     })
//   ]
// })

// const plot = Plot.plot({
//   marginTop: 0,
//   marginLeft: 4,
//   x: {
//     padding: 0.4, ticks: 4, label: "Pubmed Results"
//   },
//   marks: [
//     on(
//       Plot.barX(data, {
//         x: "count",
//         y: "pair",
//         fill: "#eee",
//         tip: true
//       }),
//       {
//         click: function(event, { datum }) {
//           d3.select(event.target).style("fill", "red");
//           console.log(datum)
//         }
//       }
//     ),
//     Plot.axisY({
//       tickSize: 0,
//       textAnchor: "start",
//       fill: "black",
//       dx: 14,
//       label: null
//     })
//   ]
// })

// const div = document.querySelector("#barplot")
// div.append(plot)


