
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface SearchResult {
    path: string;
    name: string;
    is_dir: boolean;
}

function SearchComponent() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                invoke<SearchResult[]>('search_files', { query })
                    .then((res) => setResults(res))
                    .catch(console.error);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleOpen = async (path: string) => {
        try {
            await invoke('open_path', { path });
        } catch (e) {
            console.error('Failed to open path:', e);
        }
    };

    const handleOpenParent = async (path: string) => {
        const parent = path.substring(0, path.lastIndexOf('/'));
        try {
            await invoke('open_path', { path: parent || '/' });
        } catch (e) {
            console.error('Failed to open parent:', e);
        }
    }

    return (
        <div className="search-container">
            <input
                type="text"
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '12px', fontSize: '18px', borderRadius: '8px', border: '1px solid #444', background: '#333', color: 'white' }}
            />
            <div style={{ marginTop: '10px', color: '#888', fontSize: '0.9em', textAlign: 'right' }}>
                {results.length === 0 && query && "No files found."}
                {results.length > 0 && (
                    <span>
                        Found <strong>{results.length === 3000 ? "3000+" : results.length}</strong> items
                        {results.length === 3000 && " (Limit Reached)"}
                    </span>
                )}
            </div>
            <div className="results-list" style={{ marginTop: '10px' }}>
                {results.map((result, index) => (
                    <div key={index} className="result-item" style={{ padding: '10px', borderBottom: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                                style={{ fontWeight: 'bold', color: result.is_dir ? '#ffd700' : '#fff', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleOpen(result.path)}
                                title="Click to open file/folder"
                            >
                                {result.name}
                            </span>
                            <button
                                onClick={() => handleOpenParent(result.path)}
                                style={{ fontSize: '0.8em', padding: '4px 8px', background: '#444', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                                title="Open containing folder"
                            >
                                📂 Open Location
                            </button>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#aaa' }}>{result.path}</span>
                        {/* Contextual Hook Logic Here */}
                        {result.path.startsWith('/etc') && (
                            <span style={{ fontSize: '0.8em', color: '#646cff', marginTop: '4px' }}>
                                ℹ️ Configuration file. Like Windows Registry or ProgramData.
                            </span>
                        )}
                        {(result.path.startsWith('/bin') || result.path.startsWith('/usr/bin')) && (
                            <span style={{ fontSize: '0.8em', color: '#646cff', marginTop: '4px' }}>
                                ℹ️ Executable program. Like C:\Windows\System32.
                            </span>
                        )}
                        {result.path.startsWith('/home') && (
                            <span style={{ fontSize: '0.8em', color: '#646cff', marginTop: '4px' }}>
                                ℹ️ User file. Like C:\Users\Name.
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SearchComponent;
