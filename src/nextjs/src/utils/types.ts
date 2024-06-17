type EntityType = "Researcher" | "Publication" | "FieldOfStudy" | "Venue";

export type Neo4jDate = {
  month: number;
  day: number;
  year: number;
}

export type ResearcherLink = {
  "elementId": string,
  "label": string,
}

export type FieldLink = {
  "elementId": string,
  "label": string,
}

export type Publication = {
  "identity": number,
  "elementId": string;
  "labels": EntityType[],
  "properties": {
    "authorList": string[],
    "authorIdList": string[],
    "authorS2IdList": number[],
    "publicationTitle": string,
    "publicationAbstract": string,
    "publishedIn": string;
    "publicationDate": Neo4jDate;
    "embedding": number[],
    "tldr": string,
    "fullText"?: string,
    "doi"?: string,

    // ACL
    "aclId"?: string,
    "aclUrl"?: string,

    // Semantic Scholar
    "s2Id": string,
    "s2CorpusId": number,
    "numberOfCitations": number;
    "numberOfInfluentialCitations": number;

    // Arxiv
    "arxivId"?: string,
    "arxivUrl"?: string,
  },
}

export type PublicationSearch = Publication & { "fields": Field[], "venue": Venue }

export type ResearcherSearch = Researcher

export type FieldSearch = Field & { "subfields": Field[], "supfields": Field[] }

export type Venue = {
  "identity": number,
  "elementId": string,
  "labels": EntityType[],
  "properties": {
    "venueId": string,
    "abbreviation": string,
    "hIndex": number,
    "name": string,
    "numberOfPublications": number,
    "publicationYears": number[]
  }
}

export type Researcher = {
  "identity": number,
  "elementId": string,
  "labels": EntityType[],
  "properties": {
    "lastName": string,
    "firstName": string,
    "middleName"?: string,
    "label": string,
    "hIndex": number,
    "numberOfPublications": number,
    "numberOfCitations": number,

    // Semantic Scholar
    "s2Id": string,
  },
}

export type Field = {
  "identity": number,
  "elementId": string,
  "labels": EntityType[],
  "properties": {
    "level": number[],
    "synonyms": string[],
    "description": string,
    "label": string,
    "numberOfPublications": number,
  },
}

export type FieldWithParent = Field & { parentId: string }

export type DataType = {
  id: string,
  parentId: string,
  synonyms: string[],
  numberOfPublications: number,
  description: string,
  label: string,
  _directSubordinates: number
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;