'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateContext, searchDocuments } from '@/lib/ragDocuments';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: string; // RAGで取得したコンテキスト
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `あなたは菜の花運輸の経営ダッシュボードのAIアシスタントです。
財務データ（貸借対照表、損益計算書、財務指標など）に関する質問に答え、経営分析のサポートを行います。

## 最重要指示
- ユーザーの質問に対して【関連情報】セクションで提供されるデータを必ず参照して回答してください
- 「データがない」「情報がない」とは絶対に言わないでください。【関連情報】に記載されているデータが菜の花運輸の実際のデータです
- 【関連情報】に具体的な数値が記載されている場合は、必ずその数値を引用して回答してください

## 回答のルール
- 具体的な数値を引用する際は、必ず年度と単位を明記してください（例：2025年3月期の売上高は3,629億円）
- 分析や提案をする際は、【関連情報】のデータを根拠として示してください
- 回答は簡潔かつ分かりやすく、重要なポイントを箇条書きで示すと効果的です

## 会社概要
菜の花運輸は運送会社で、トラック運送を主力とする総合物流企業です。
2016年〜2025年の10年間の財務データがあります。`;

export default function AIChatSidebar({ isOpen, onToggle }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();

    // RAGでコンテキストを取得
    const relevantDocs = searchDocuments(userQuery, 5);
    const context = generateContext(userQuery);

    // デバッグ: コンソールに検索結果を出力
    console.log('RAG検索クエリ:', userQuery);
    console.log('検索された文書数:', relevantDocs.length);
    console.log('検索された文書:', relevantDocs.map(d => d.title));
    console.log('コンテキスト長:', context.length);

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: userQuery
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // RAGコンテキストを含めたプロンプトを構築
      // コンテキストがある場合は必ず使用
      const userPrompt = context && context.length > 0
        ? `【質問】\n${userQuery}\n\n【関連情報（菜の花運輸の財務データベースから取得）】\n${context}`
        : `【質問】\n${userQuery}\n\n※注意：この質問に関連するデータが見つかりませんでした。一般的な知識で回答してください。`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })), // 直近6件のみ
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.choices[0].message.content,
        context: relevantDocs.length > 0
          ? `参照: ${relevantDocs.map(d => d.title).join(', ')}`
          : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: '申し訳ありません。エラーが発生しました。しばらく経ってからもう一度お試しください。'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中（isComposing）はEnterで送信しない
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* トグルボタン（常に表示） */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 shadow-lg transition-all duration-300 ${
          isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
        style={{ borderRadius: '8px 0 0 8px' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* サイドバー */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI アシスタント</h3>
              <p className="text-xs text-gray-500">RAGで財務データを参照</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="チャットをクリア"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100vh - 180px)' }}>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                財務データについて質問してください
              </p>
              <p className="text-xs text-gray-400 mb-4">
                RAGで実データを参照して回答します
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setInput('2025年3月期の業績を教えてください')}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  2025年3月期の業績を教えてください
                </button>
                <button
                  onClick={() => setInput('ROEとPBRの状況を分析してください')}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  ROEとPBRの状況を分析してください
                </button>
                <button
                  onClick={() => setInput('コスト構造の課題は何ですか？')}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  コスト構造の課題は何ですか？
                </button>
                <button
                  onClick={() => setInput('主要株主と議決権の状況を教えてください')}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  主要株主と議決権の状況を教えてください
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {/* RAGコンテキスト表示 */}
                  {message.context && message.role === 'assistant' && (
                    <button
                      onClick={() => setShowContext(showContext === message.id ? null : message.id)}
                      className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {showContext === message.id ? '参照情報を非表示' : '参照情報を表示'}
                    </button>
                  )}
                  {showContext === message.id && message.context && (
                    <div className="mt-1 px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded">
                      {message.context}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500">データを検索中...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="財務データについて質問..."
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-colors ${
                input.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Shift + Enter で改行 | RAG対応
          </p>
        </div>
      </div>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
}
