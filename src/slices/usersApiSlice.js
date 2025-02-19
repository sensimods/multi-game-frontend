// import { apiSlice } from './apiSlice'
// const USERS_URL = '/api/users'

// export const usersApiSlice = apiSlice.injectEndpoints({ //injects into endpoints in './apiSlice'
//   endpoints: (builder) => ({
//     login: builder.mutation({
//       query: (data) => ({
//         url: `${USERS_URL}/auth`,
//         method: 'POST',
//         body: data
//       })
//     }),
//     register: builder.mutation({
//       query: (data) => ({
//         url: `${USERS_URL}`,
//         method: 'POST',
//         body: data
//       })
//     }),
//     logout: builder.mutation({
//       query: () => ({
//         url: `${USERS_URL}/logout`,
//         method: 'POST'
//       })
//     }),
//     updateUser: builder.mutation({
//       query: (data) => ({
//         url: `${USERS_URL}/profile`,
//         method: 'PUT',
//         body: data
//       })
//     }),
//   })
// })

// export const {useLoginMutation, useLogoutMutation, useRegisterMutation, useUpdateUserMutation} = usersApiSlice

import { apiSlice } from './apiSlice'
const USERS_URL = '/api/users'

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: 'POST',
        body: data
      })
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: 'POST',
        body: data
      })
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: 'POST'
      })
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: 'PUT',
        body: data
      })
    }),
    // Add new endpoint to fetch latest stats
    fetchUserStats: builder.query({
      query: (userId) => ({
        url: `${USERS_URL}/${userId}/stats`,
        method: 'GET'
      })
    })
  })
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useUpdateUserMutation,
  useFetchUserStatsQuery
} = usersApiSlice