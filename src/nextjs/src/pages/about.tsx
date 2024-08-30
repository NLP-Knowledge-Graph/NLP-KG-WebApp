// pages/about.js

import React, {useState} from 'react';
import Head from 'next/head';
import TimSchopf from "public/team/tim-schopf.png";
import FlorianMatthes from "public/team/florian-matthes.png";
import RonaldErnst from "public/team/ronald-ernst.png";
import PatrickKufner from "public/team/patrick-kufner.png";
import FerdyHadiwijaya from "public/team/ferdy-hadiwijaya.png";
import CansuDogonay from "public/team/cansu-doganay.png";

const ArrowUpIcon = () => (
  <svg
    className="h-5 w-5"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg
    className="h-5 w-5"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
  </svg>
);


const About = () => {
  const [faqOpen, setFaqOpen] = useState(null);

  const faqData = [
    {
      question: 'What is the advantage of using NLP-KG instead of other academic search engines?',
      answer: 'NLP-KG provides comprehensive support for researchers engaged in the search and exploration of academic papers within the field of NLP. ' +
        'It was developed specifically to meet the needs of the NLP community. ' +
        'Our system is not intended to replace commonly used search engines but to serve as a supplementary tool for dedicated exploratory search of NLP research literature.',
    },
    {
      question: 'Which features does NLP-KG offer?',
      answer: (
        <div>
          <p>NLP-KG offers several key features, including:</p>
          <ul className="list-disc pl-6">
            <li><b>Semantic Search</b> using BM25 and SPECTER2 embeddings for hybrid retrieval providing an optimal
              keyword-based search experience.
            </li>
            <li><b>Hierarchy Graph</b> to explore Fields of Study and their associated papers in NLP.</li>
            <li><b>Advanced Filters</b> such as e.g., filtering by survey papers to get a quick overview of a specific
              field of interest.
            </li>
            <li><b>Chat</b> using a Retrieval Augmented Generation (RAG) pipeline to recommend relevant research
              literature
              and answer NLP-related user questions based on knowledge grounded in research papers.
            </li>
            <li><b>Ask This Paper</b> using an LLM and the full texts of papers to answer user questions about a
              specific paper.
            </li>
            <li><b>Bookmark Lists</b> to save interesting research papers, create notes and collaborate with others.
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: 'Which papers are included in NLP-KG?',
      answer: 'NLP-KG includes papers from the ACL Anthology and the arXiv cs.CL category. We update our databases regularly to stay up-to-date with newest research.',
    },
    {
      question: 'How can I use the chat?',
      answer: 'To use the chat, please create a profile and provide a valid OpenAI API key.',
    },
    {
      question: 'Which LLM do you use?',
      answer: (<p>We use the <i>GPT-4o mini</i> model from OpenAI for our LLM-based features.</p>),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <Head>
        <title>About Us - NLP-KG</title>
        <meta name="description" content="Learn more about our website and mission." />
      </Head>

      <main className="max-w-3xl p-6 bg-white rounded-md shadow-md">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-4">About Us</h1>
          <p>
            Welcome to the <b>Natural Language Processing Knowledge Graph (NLP-KG)</b>. <br/>
            NLP-KG is a research project, aiming to provide comprehensive support for researchers engaged in the
            search and exploration of academic papers within the field of Natural Language Processing (NLP).
            Equipped with advanced features, this application was developed by researchers and explicitly tailored to
            the needs of the academic community.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Meet the Team</h2>
          <p>
            Our dedicated team works tirelessly to ensure that you have the best experience on our website.
            Get to know the individuals who contribute to making this platform great.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Researchers */}
            <div className="flex flex-col items-center">
              <img src={TimSchopf.src} alt="Tim Schopf" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Tim Schopf</h3>
              <p className="text-gray-700">Researcher</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={FlorianMatthes.src} alt="Prof. Dr. Florian Matthes" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Prof. Dr. Florian Matthes</h3>
              <p className="text-gray-700">Principal Investigator</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {/* Developers */}
            <div className="flex flex-col items-center">
              <img src={FerdyHadiwijaya.src} alt="Ferdy Hadiwijaya" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Ferdy Hadiwijaya</h3>
              <p className="text-gray-700">Developer</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={RonaldErnst.src} alt="Ronald Ernst" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Ronald Ernst</h3>
              <p className="text-gray-700">Developer</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={PatrickKufner.src} alt="Patrick Kufner" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Patrick Kufner</h3>
              <p className="text-gray-700">Developer</p>
            </div>
            <div className="flex flex-col items-center">
              <img src={CansuDogonay.src} alt="Cansu Doğanay" className="w-32 h-32 rounded-full mb-2"/>
              <h3 className="text-l font-bold">Cansu Doğanay</h3>
              <p className="text-gray-700">Developer</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p>
            Have questions, suggestions, or just want to say hello? Feel free to contact us.
            We appreciate your feedback and look forward to hearing from you! <br/>
            Create an issue on <a href="https://github.com/NLP-Knowledge-Graph/NLP-KG-WebApp" target="_blank"
                                  rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a> or
            write an e-mail to <a href="mailto:tim.schopf@tum.de"
                                  className="text-blue-500 hover:underline">tim.schopf@tum.de</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions (FAQs)</h2>
          <ul>
            {faqData.map((item, index) => (
                <li key={index} className="mb-4">
                  <button
                      onClick={() => setFaqOpen((prev) => (prev === index ? null : index))}
                      className="bg-primary text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 p-2 w-full text-left flex items-center justify-between"
                      aria-expanded={faqOpen === index}
                      aria-controls={`faq-answer-${index}`}
                  >
                    <span>{item.question}</span>
                    <span>{faqOpen === index ? <ArrowUpIcon/> : <ArrowDownIcon/>}</span>
                  </button>

                  {faqOpen === index && (
                      <div id={`faq-answer-${index}`} className="bg-gray-100 p-2">
                        <p>{item.answer}</p>
                      </div>
                  )}
                </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Citation Information</h2>
          <p>
            You can find more details in our ACL 2024 Paper <a href="https://aclanthology.org/2024.acl-demos.13"
                                                               target="_blank"
                                                               rel="noopener noreferrer"
                                                               className="text-blue-500 hover:underline">NLP-KG: A
            System for Exploratory Search of Scientific Literature in Natural Language Processing</a>. When citing our
            work in academic papers and theses, please use the following BibTeX entry:
          </p>
          <pre className="bg-gray-100 p-4 overflow-x-auto">
            <code className="text-sm">
            {`@inproceedings{schopf-matthes-2024-nlp,
                title = "{NLP}-{KG}: A System for Exploratory Search of Scientific Literature in Natural Language Processing",
                author = "Schopf, Tim  and
                  Matthes, Florian",
                editor = "Cao, Yixin  and
                  Feng, Yang  and
                  Xiong, Deyi",
                booktitle = "Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 3: System Demonstrations)",
                month = aug,
                year = "2024",
                address = "Bangkok, Thailand",
                publisher = "Association for Computational Linguistics",
                url = "https://aclanthology.org/2024.acl-demos.13",
                pages = "127--135",
                abstract = "Scientific literature searches are often exploratory, whereby users are not yet familiar with a particular field or concept but are interested in learning more about it. However, existing systems for scientific literature search are typically tailored to keyword-based lookup searches, limiting the possibilities for exploration. We propose NLP-KG, a feature-rich system designed to support the exploration of research literature in unfamiliar natural language processing (NLP) fields. In addition to a semantic search, NLP-KG allows users to easily find survey papers that provide a quick introduction to a field of interest. Further, a Fields of Study hierarchy graph enables users to familiarize themselves with a field and its related areas. Finally, a chat interface allows users to ask questions about unfamiliar concepts or specific articles in NLP and obtain answers grounded in knowledge retrieved from scientific publications. Our system provides users with comprehensive exploration possibilities, supporting them in investigating the relationships between different fields, understanding unfamiliar concepts in NLP, and finding relevant research literature. Demo, video, and code are available at: https://github.com/NLP-Knowledge-Graph/NLP-KG-WebApp.",
            }`}
            </code>
          </pre>
        </section>

      </main>
    </div>
  );
};
export default About;
