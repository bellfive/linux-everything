
import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface SearchResult {
    path: string;
    name: string;
    is_dir: boolean;
    size: number; // Changed from u64 to number for TypeScript
}

const SearchComponent: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                invoke<SearchResult[]>('search_files', {
                    query,
                    caseSensitive,
                    wholeWord
                })
                    .then((res) => setResults(res))
                    .catch(console.error);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, caseSensitive, wholeWord]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const sortedResults = [...results].sort((a, b) => {
        if (sortOrder === 'none') return 0;
        return sortOrder === 'asc' ? a.size - b.size : b.size - a.size;
    });

    const handleOpen = async (path: string) => {
        try {
            await invoke('open_path', { path });
        } catch (e) {
            console.error('Failed to open path:', e);
        }
    }

    const handleOpenParent = async (path: string) => {
        const parent = path.substring(0, path.lastIndexOf('/'));
        try {
            await invoke('open_path', { path: parent || '/' });
        } catch (e) {
            console.error('Failed to open parent:', e);
        }
    }

    const getContext = (path: string) => {
        if (path.startsWith('/etc')) return '⚙️ System Configuration';
        if (path.startsWith('/bin') || path.startsWith('/usr/bin')) return '🏃 Executable Program';
        if (path.startsWith('/home')) return '👤 User File';
        if (path.startsWith('/var/log')) return '📝 System Log';
        return '';
    }

    return (
        <div className="search-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <input
                ref={inputRef}
                type="text"
                placeholder="Search files (e.g. *.sh, /etc/conf)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
                style={{ width: '100%', padding: '12px', fontSize: '18px', borderRadius: '8px', border: '1px solid #444', background: '#333', color: 'white' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '15px', color: '#ccc', fontSize: '0.9em' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
                        Case Sensitive
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
                        Whole Word
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        style={{ padding: '4px 8px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em' }}
                    >
                        Sort by Size {sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : sortOrder === 'none' ? '↕' : ''}
                    </button>
                    <div style={{ color: '#888', fontSize: '0.9em' }}>
                        {results.length === 0 && query && "No files found."}
                        {results.length > 0 && (
                            <span>
                                Found <strong>{results.length === 3000 ? "3000+" : results.length}</strong> items
                                {results.length === 3000 && " (Limit Reached)"}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="results-list" style={{ marginTop: '15px' }}>
                {sortedResults.map((result, index) => (
                    <div key={index} className="result-item" style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', marginBottom: '5px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2em' }}>{result.is_dir ? '📁' : '📄'}</span>
                                <span style={{ fontWeight: 'bold', color: '#fff' }}>{result.name}</span>
                                {!result.is_dir && <span style={{ color: '#888', fontSize: '0.85em' }}>({formatSize(result.size)})</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenParent(result.path)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #555', background: '#444', color: 'white', cursor: 'pointer', fontSize: '0.85em' }}>Folder</button>
                                <button onClick={() => handleOpen(result.path)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#0078d4', color: 'white', cursor: 'pointer', fontSize: '0.85em' }}>Open</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all', maxWidth: '70%' }}>{result.path}</span>
                            {getContext(result.path) && (
                                <span style={{ fontSize: '10px', color: '#00dc82', backgroundColor: 'rgba(0,220,130,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {getContext(result.path)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SearchComponent;
