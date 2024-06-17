import axios from "axios";
import qs from "qs";
import { env } from "~/env.cjs";

type PythonPublicationResult = {
  neo4jID: string;
  title: string;
  abstract: string;
  venue: string;
  authors: string[];
  year: number;
  n_citations: number;
  field_list: string[];
  publication_date: string;
};

export const getPublications = async (params: {
  query_string: string;
  offset: number;
  search_type: string;
  limit: number;
  field_filters: string[];
  sort_option: string;
  min_citation_filter: number;
  min_date_filter: number;
  max_date_filter: number;
  venue_filters: string[];
  survey_filter: boolean | undefined;
}) => {
  const { data } = await axios.get<{
    papers: PythonPublicationResult[];
    hasNext: boolean;
    total: number;
    statistics: Record<number, number>;
  }>(env.BACKEND_URI, {
    params,
    timeout: 10000,
    headers: {
      Accept: "application/json", // Specify that we want JSON in return
    },
    paramsSerializer: (params) =>
      qs.stringify(params, { arrayFormat: "repeat" }),
  });

  return data;
};
