export const queries = {
  weeklyDataQuery: `
SELECT
	week, COALESCE(sum, 0) as beersdrank
FROM (
	SELECT
		date_part('week', t.day) AS week_of_year,
		to_char(date_trunc('week', t.day)::date, 'mm/dd') || '-' || to_char((date_trunc('week', t.day) + '6 days')::date, 'mm/dd') AS Week
	FROM
		generate_series(date_trunc('year', CURRENT_DATE), date_trunc('year', CURRENT_DATE + INTERVAL '1yr'), interval '1 week') AS t (day)) Y
	FULL JOIN (
		SELECT
			date_part('week', "createdAt") AS week_of_year,
			sum("beersDrank")
		FROM
			"public".keg_data
			JOIN "public".keg ON keg.id = "public".keg_data. "kegId"
				AND keg. "userId" = $1
		WHERE
			"kegId" = $2
		GROUP BY
			date_part('week', "createdAt")) Z ON Y.week_of_year = Z.week_of_year
WHERE
	Y.week_of_year <= date_part('week', CURRENT_DATE)
ORDER BY
  Y.week_of_year DESC
LIMIT 5
`,
  dailyDataQuery: `SELECT
day as "createdAt", COALESCE(sum, 0) as beersdrank
FROM
generate_series(date_trunc('year', CURRENT_DATE), date_trunc('year', CURRENT_DATE + INTERVAL '1yr'), interval '1 day') AS t (day)
FULL JOIN (
  SELECT
    CAST("createdAt" AS DATE) AS "createdAt",
    SUM("beersDrank")
  FROM
    "public".keg_data
  JOIN "public".keg on keg.id = "public".keg_data."kegId"
  WHERE
    "kegId" = $1
  AND "userId" = $2
  GROUP BY
    CAST("createdAt" AS DATE)) X ON CAST(day AS DATE) = x. "createdAt"
WHERE
day <= CURRENT_DATE
ORDER BY
day DESC
LIMIT 5`,

  monthlyDataQuery: `
	SELECT
	Y.month_of_year as month, Y.year_of_month as year, COALESCE(sum, 0) as beersdrank
FROM (
	SELECT 
 		date_part('month', t) AS month_of_year,
 		date_part('year', t) AS year_of_month
			FROM
		generate_series(CURRENT_DATE - INTERVAL '1yr', CURRENT_DATE, interval '1month') AS t) Y
	FULL JOIN (
		SELECT
			date_part('month', "createdAt") AS month_of_year,
			date_part('year', "createdAt") AS year_of_month,
			sum("beersDrank")
		FROM
			"public".keg_data
			JOIN "public".keg ON keg.id = "public".keg_data. "kegId"
				AND keg. "userId" = $1
		WHERE
			"kegId" = $2
		GROUP BY
			date_part('month', "createdAt"),
			date_part('year', "createdAt")
			) Z ON Y.month_of_year = Z.month_of_year 
			AND Y.year_of_month = Z.year_of_month
ORDER BY
	Y.year_of_month DESC,
	Y.month_of_year DESC
limit 5;
`,
};
