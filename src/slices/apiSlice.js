import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({baseUrl: ''}) //empty string because we are using a proxy

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['User'], //tag types for caching to prevent making api calls when not needed. 'products', 'blog posts' would be examples of others
  endpoints: (builder) => ({}),
  //keepUnusedDataFor: 0, // Add this line
})