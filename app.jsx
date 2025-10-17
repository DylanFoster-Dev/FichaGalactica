const { useEffect, useMemo, useState } = React;

function App() {
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [peopleError, setPeopleError] = useState(null);

  const [selectedUrl, setSelectedUrl] = useState("");

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [homeworldName, setHomeworldName] = useState("");
  const [loadingHomeworld, setLoadingHomeworld] = useState(false);

  const [nickname, setNickname] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [summary, setSummary] = useState(null);

  const nicknameError = useMemo(() => {
    if (nickname.trim().length === 0) return null;
    if (nickname.trim().length < 2) return "El apodo debe tener al menos 2 caracteres.";
    return null;
  }, [nickname]);

  useEffect(() => {
    const saved = window.localStorage.getItem("ficha-galactica");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.selectedUrl) setSelectedUrl(parsed.selectedUrl);
        if (typeof parsed.favorite === "boolean") setFavorite(parsed.favorite);
        if (typeof parsed.nickname === "string") setNickname(parsed.nickname);
        if (parsed.summary) setSummary(parsed.summary);
      } catch {}
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingPeople(true);
    setPeopleError(null);
    fetch("https://swapi.dev/api/people/?page=1")
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar la lista de personajes");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPeople(Array.isArray(data.results) ? data.results : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setPeopleError(err.message || String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingPeople(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedUrl) {
      setDetail(null);
      setHomeworldName("");
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    setDetailError(null);
    setDetail(null);
    setHomeworldName("");
    fetch(selectedUrl)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el detalle del personaje");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailError(err.message || String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUrl]);

  useEffect(() => {
    if (!detail || !detail.homeworld) return;
    let cancelled = false;
    setLoadingHomeworld(true);
    setHomeworldName("");
    fetch(detail.homeworld)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el planeta");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setHomeworldName(data.name || "");
      })
      .catch(() => {
        if (cancelled) return;
        setHomeworldName("");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingHomeworld(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detail?.homeworld]);

  function handleSave(e) {
    e.preventDefault();
    if (!detail) return;
    const ficha = {
      character: {
        name: detail.name,
        height: detail.height,
        birth_year: detail.birth_year,
        homeworld: homeworldName || null,
        url: selectedUrl,
      },
      nickname: nickname.trim(),
      favorite,
      savedAt: new Date().toISOString(),
      selectedUrl,
    };
    setSummary(ficha);
    try {
      window.localStorage.setItem("ficha-galactica", JSON.stringify(ficha));
    } catch {}
  }

  const isSaveDisabled = !detail || !!nicknameError || nickname.trim().length === 0;

  return (
    <div className="row">
      <form onSubmit={handleSave} className="row two">
        <fieldset>
          <legend>1. Elegí un personaje</legend>
          {loadingPeople && <p className="hint">Cargando personajes…</p>}
          {peopleError && <p className="error">{peopleError}</p>}
          <label htmlFor="personSelect">Personaje</label>
          <select
            id="personSelect"
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            disabled={loadingPeople || !!peopleError}
          >
            <option value="">— Seleccioná —</option>
            {people.map((p) => (
              <option key={p.url} value={p.url}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="hint">Se consultan datos de `https://swapi.dev`.</p>
        </fieldset>

        <fieldset>
          <legend>2. Tu ficha</legend>
          <label htmlFor="nickname">Apodo en tu ficha</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="p. ej.: El Elegido"
            aria-describedby="nickHelp"
          />
          <span id="nickHelp" className="hint">Mínimo 2 caracteres.</span>
          {nicknameError && <p className="error">{nicknameError}</p>}

          <div style={{ marginTop: 8 }}>
            <input
              id="favorite"
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
            />
            <label htmlFor="favorite" style={{ display: "inline", marginLeft: 8 }}>
              ¿Es tu favorito?
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={isSaveDisabled}>Guardar ficha</button>
          </div>
        </fieldset>

        <fieldset style={{ gridColumn: "1 / -1" }}>
          <legend>Vista previa</legend>
          {!selectedUrl && <p className="hint">Elegí un personaje para ver su ficha.</p>}
          {loadingDetail && <p className="hint">Cargando detalle…</p>}
          {detailError && <p className="error">{detailError}</p>}
          {detail && (
            <div className="preview">
              <div><strong>Nombre:</strong> {detail.name}</div>
              <div><strong>Altura:</strong> {detail.height} cm</div>
              <div><strong>Nacimiento:</strong> {detail.birth_year}</div>
              <div>
                <strong>Planeta:</strong>{" "}
                {loadingHomeworld ? "cargando…" : homeworldName || "—"}
              </div>
            </div>
          )}
        </fieldset>

        <fieldset style={{ gridColumn: "1 / -1" }}>
          <legend>Resumen guardado</legend>
          {!summary && <p className="hint">Guardá tu ficha para verla acá.</p>}
          {summary && (
            <div className="summary">
              <div><strong>Personaje:</strong> {summary.character.name}</div>
              <div><strong>Altura:</strong> {summary.character.height} cm</div>
              <div><strong>Nacimiento:</strong> {summary.character.birth_year}</div>
              {summary.character.homeworld && (
                <div><strong>Planeta:</strong> {summary.character.homeworld}</div>
              )}
              <div><strong>Apodo:</strong> {summary.nickname || "—"}</div>
              <div><strong>Favorito:</strong> {summary.favorite ? "Sí" : "No"}</div>
              <div className="hint">Guardado: {new Date(summary.savedAt).toLocaleString()}</div>
            </div>
          )}
        </fieldset>
      </form>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);


