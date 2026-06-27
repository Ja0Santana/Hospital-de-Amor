import { useState, useEffect, useRef } from 'react';
import { Copy, Check, Coins } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface CryptoPaymentPanelProps {
  amount: number;
  onSuccess: (method: 'Criptomoedas', hashTx: string) => Promise<void>;
  loading: boolean;
}

const CRYPTO_WALLETS = {
  btc: 'bc1qxy2kg3k4g7kkqfzv7lmv400xp3v22tt965ff0',
  eth: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  usdt: 'TX5b1A1zP1eP5QGefi2DMPTfTL5SLmv7Div',
};

export default function CryptoPaymentPanel({
  amount,
  onSuccess,
  loading,
}: CryptoPaymentPanelProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<'btc' | 'eth' | 'usdt'>('btc');
  const [btcRate, setBtcRate] = useState(375240);
  const [ethRate, setEthRate] = useState(19820);
  const [usdtRate, setUsdtRate] = useState(5.45);
  const [cryptoTimeLeft, setCryptoTimeLeft] = useState(900);
  const [copiedCryptoWallet, setCopiedCryptoWallet] = useState(false);
  const cryptoTimerRef = useRef<any | null>(null);

  useEffect(() => {
    startCryptoTimer();
    return () => stopCryptoTimer();
  }, []);

  const updateCryptoRates = () => {
    setBtcRate(375000 + Math.random() * 800 - 400);
    setEthRate(19500 + Math.random() * 100 - 50);
    setUsdtRate(5.45 + Math.random() * 0.1 - 0.05);
  };

  const startCryptoTimer = () => {
    stopCryptoTimer();
    setCryptoTimeLeft(900);
    cryptoTimerRef.current = setInterval(() => {
      setCryptoTimeLeft((prev) => {
        if (prev <= 1) {
          updateCryptoRates();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCryptoTimer = () => {
    if (cryptoTimerRef.current) {
      clearInterval(cryptoTimerRef.current);
      cryptoTimerRef.current = null;
    }
  };

  const handleCopyWallet = () => {
    setCopiedCryptoWallet(true);
    navigator.clipboard.writeText(CRYPTO_WALLETS[selectedCrypto]);
    setTimeout(() => setCopiedCryptoWallet(false), 2000);
  };

  const handleConfirmSimulation = async () => {
    const randHash = 'TX-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 24);
    await onSuccess('Criptomoedas', randHash);
  };

  const getCryptoAmount = () => {
    if (selectedCrypto === 'btc') return (amount / btcRate).toFixed(8);
    if (selectedCrypto === 'eth') return (amount / ethRate).toFixed(6);
    return (amount / usdtRate).toFixed(2);
  };

  const getNetworkName = () => {
    if (selectedCrypto === 'btc') return 'Rede Bitcoin';
    if (selectedCrypto === 'eth') return 'Rede Ethereum ERC-20';
    return 'Rede Tron TRC-20';
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4 animate-in fade-in">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Selecione a Criptomoeda</Label>
        <select
          value={selectedCrypto}
          onChange={(e) => setSelectedCrypto(e.target.value as 'btc' | 'eth' | 'usdt')}
          className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs px-3 text-zinc-900 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
        >
          <option value="btc">Bitcoin (BTC)</option>
          <option value="eth">Ethereum (ETH)</option>
          <option value="usdt">Tether (USDT TRC20)</option>
        </select>
      </div>

      <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl flex justify-between items-center text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 block font-bold uppercase">Valor a Transferir</span>
          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono">
            {getCryptoAmount()} {selectedCrypto.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 block font-bold uppercase">Rede Recomendada</span>
          <span className="text-xs font-black text-brand-pink uppercase tracking-wide">
            {getNetworkName()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center space-y-2 pt-1">
        <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-36 h-36 flex items-center justify-center relative">
          <Coins className="w-16 h-16 text-zinc-900" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider block">
            Garantia de Cotação
          </span>
          <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 font-mono">
            Cotação expira em {Math.floor(cryptoTimeLeft / 60)}:{(cryptoTimeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Endereço da Carteira ({selectedCrypto.toUpperCase()})
        </Label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={CRYPTO_WALLETS[selectedCrypto]}
            className="h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-950/30 font-mono text-zinc-500 rounded-xl flex-1 select-all focus-visible:ring-brand-pink"
          />
          <Button
            onClick={handleCopyWallet}
            variant="outline"
            className="h-10 w-10 shrink-0 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 flex items-center justify-center p-0"
          >
            {copiedCryptoWallet ? <Check className="w-4 h-4 text-green-650" /> : <Copy className="w-4 h-4 text-zinc-550" />}
          </Button>
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
        <span className="text-[9px] text-zinc-450 dark:text-zinc-550 leading-normal text-center">
          Atenção: envie apenas {selectedCrypto.toUpperCase()} para o endereço acima utilizando a rede indicada. O envio
          de outro ativo resultará em perda permanente.
        </span>
        <Button
          onClick={handleConfirmSimulation}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs mt-1 transition-all"
        >
          Simular Confirmação Blockchain (Sucesso)
        </Button>
      </div>
    </div>
  );
}
