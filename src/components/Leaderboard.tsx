/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./leaderboard.css";
import { UploadHandler } from "./uploadHandler";
import { useUsername } from "../hooks/useUsername";


type SortKey = 1 | 2 | 3;         // 1 username, 2 score, 3 date
type SortType = SortKey | -1 | -2 | -3;
type FilterType = 0 | 1 | 2;      // 0 all, 1 human, 2 AI

export type ScoreRow = {
  rank: number;
  username: string;
  score: number;
  date: string;   // ISO string
};

const itemsPerPage = 10;

function Leaderboard() {
  const navigate = useNavigate();
  const {username, setUsername } = useUsername();

  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [sortType, setSortType] = useState<SortType>(2); // 1 username, 2 score, 3 date (- for reversed)
  const [page, setPage] = useState<number>(0);
  const [entries, setEntries] = useState<number>(0);
  const [query, setQuery] = useState<string>("");
  const [message, setMessage] = useState<string>("Enter a username to search");
  const [filter, setFilter] = useState<FilterType>(0);

  const gotToHome = () => navigate("/");

  async function goToUser() {
    try {
      // Expecting: returns a page index for the given user, or -1 / null if not found
      const userPageIndex = await UploadHandler.getScoresFromUsername(
        username,
        itemsPerPage
      );
      if (typeof userPageIndex === "number" && userPageIndex >= 0) {
        setPage(userPageIndex);
        setSortType(2);
        setMessage(`Found user ${username}`);
      } else {
        setMessage(`${username} not found`);
      }
    } catch (e) {
      setMessage(`Error locating ${username}`);
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim();
      if (q === "") {
        setMessage("Enter a username to search");
        return;
      }
      try {
        const userPageIndex = await UploadHandler.getScoresFromUsername(
          q,
          itemsPerPage
        );
        if (typeof userPageIndex === "number" && userPageIndex >= 0) {
          setPage(userPageIndex);
          setSortType(2);
          setMessage(`found user ${q}`);
        } else {
          setMessage(`${q} not found`);
        }
      } catch {
        setMessage(`Error searching for ${q}`);
      }
    }
  }

  async function getNEntries(): Promise<number> {
    const n = await UploadHandler.getNEntries();
    setEntries(n);
    return n;
  }

  async function incrementPage() {
    const n = await getNEntries(); // total entries
    const nextPage = page + 1;
    if (nextPage * itemsPerPage < n) {
      setPage(nextPage);
      // getData will run via effect
      setMessage("Enter a username to search");
    }
  }

  function decrementPage() {
    if (page > 0) {
      setPage(page - 1);
      setMessage("Enter a username to search");
    }
  }

  function handleSortTypeChange(type: SortKey) {
    setMessage("Enter a username to search");
    setPage(0);
    if (type === Math.abs(sortType) as SortKey) {
      setSortType((prev) => (prev * -1) as SortType);
    } else {
      setSortType(type);
    }
  }

  async function getData() {
    // Expected signature: (sortType, from, to) => Promise<ScoreRow[]>
    const from = page * itemsPerPage;
    const to = (page + 1) * itemsPerPage;
    const data: ScoreRow[] | null = await UploadHandler.getScores(
      sortType,
      from,
      to,
    );
    if (data && Array.isArray(data)) {
      setScores(data);
    }
  }

  useEffect(() => {
    getData();
  }, [sortType, page, filter]);

  useEffect(() => {
    (async () => {
      await getNEntries();
    })();
  }, [scores]);

  function updateFilter() {
    setFilter((prev) => ((prev + 1) % 3) as FilterType);
  }

  return (
    <>
      <div className="header-container">
        <h3>
          <button className="leaderboard-button" onClick={gotToHome}>
            Battle
          </button>
        </h3>
        <h1>Leaderboard</h1>
        <h3>
          <button className="reload-button" onClick={getData}>
            Reload
          </button>
        </h3>
      </div>

      <div className="leaderboard-container">
        <h1>
          <button className="page-button" onClick={decrementPage}>
            ▲
          </button>
        </h1>

        <div className="table-container">
          <table className="scores">
            <thead>
              <tr>
                <th>
                  <button
                    className="table-header-button"
                    onClick={() => handleSortTypeChange(2)}
                  >
                    Rank{" "}
                    {sortType === 2 ? "▲" : sortType === -2 ? "▼" : ""}
                  </button>
                </th>
                <th>
                  <button
                    className="table-header-button"
                    onClick={() => handleSortTypeChange(1)}
                  >
                    Username{" "}
                    {sortType === 1 ? "▲" : sortType === -1 ? "▼" : ""}
                  </button>
                </th>
                <th>
                  <button
                    className="table-header-button"
                    onClick={() => handleSortTypeChange(2)}
                  >
                    Score{" "}
                    {sortType === 2 ? "▲" : sortType === -2 ? "▼" : ""}
                  </button>
                </th>
                <th>
                  <button
                    className="table-header-button"
                    onClick={() => handleSortTypeChange(3)}
                  >
                    Date{" "}
                    {sortType === 3 ? "▲" : sortType === -3 ? "▼" : ""}
                  </button>
                </th>
                <th>
                  Time <span style={{ fontSize: "0.8em" }}>(UTC)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {scores.map((i) => (
                <tr key={`${i.username}-${i.date}`}>
                  <td>{i.rank}</td>
                  <td>{i.username}</td>
                  <td>{i.score}</td>
                  <td>{i.date.substring(0, 10)}</td>
                  <td>{i.date.substring(11, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer-container">
        <h3>
          <span className="showing-pages">
            Page {page + 1} of {Math.max(1, Math.ceil(entries / itemsPerPage))}
          </span>
        </h3>
        <h3>
          <button className="filter-button" onClick={updateFilter}>
            Filter: {filter === 0 ? "all" : filter === 1 ? "Human only" : "AI only"}
          </button>
        </h3>
        <h1>
          <button className="page-button" onClick={incrementPage}>
            ▼
          </button>
        </h1>
        <h3>
          <span className="showing-entries">
            Showing {entries === 0 ? 0 : page * itemsPerPage + 1}-
            {Math.min((page + 1) * itemsPerPage, entries)} of {entries}
          </span>
        </h3>
        <h3>
          <button className="goto-user" onClick={goToUser}>
            My Rank
          </button>
        </h3>
        <span className="search-user">
          <input
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="username"
            aria-label="Search"
          />
          <br />
          {message}
        </span>
      </div>
    </>
  );
}

export default Leaderboard;
