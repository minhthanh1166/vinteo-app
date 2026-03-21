(function () {
  if (!window.axios) {
    window.DashboardAxios = null;
    return;
  }

  const vinteo = window.axios.create({
    baseURL: "/api/vinteo",
    timeout: 20000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  vinteo.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      if (error && error.response && error.response.data) {
        return Promise.reject(error);
      }

      const wrapped = {
        response: {
          status: 0,
          data: {
            error: "Network error while calling backend proxy.",
          },
        },
      };
      return Promise.reject(wrapped);
    },
  );

  window.DashboardAxios = {
    vinteo: vinteo,
  };
})();
