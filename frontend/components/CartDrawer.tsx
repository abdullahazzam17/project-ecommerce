"use client";

import { useRef } from "react";
import { HANDLING_FEE } from "../lib/api";
import type { CartItem } from "../lib/types";
import { useFocusTrap } from "../lib/useFocusTrap";

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onCheckout: () => void;
  onRemove: (index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  isProcessing: boolean;
}

export default function CartDrawer({
  open,
  cart,
  onClose,
  onCheckout,
  onRemove,
  onQuantityChange,
  isProcessing,
}: CartDrawerProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, onClose, dialogRef);

  if (!open) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + (cart.length > 0 ? HANDLING_FEE : 0);
  const hasDemoItem = cart.some((item) => item.product.isDemo);

  return (
    <div className="zc-fade-in fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="zc-slide-in flex h-full w-full max-w-md flex-col justify-between bg-surface p-6 shadow-2xl"
      >
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <h3 id="cart-title" className="text-lg font-black uppercase">
              Shopping bag ({totalQuantity})
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shopping bag"
              className="min-h-11 border border-ink px-3 text-xs font-bold uppercase transition-colors duration-200 hover:bg-ink hover:text-inverse"
            >
              Close
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm uppercase text-muted">Your bag is empty.</p>
          ) : (
            <ul className="max-h-[58vh] space-y-4 overflow-y-auto pr-1">
              {cart.map((item, index) => (
                <li key={`${item.product.id}-${item.size}`} className="flex gap-4 border-b border-line pb-4">
                  <span className="block h-20 w-16 shrink-0 overflow-hidden bg-[#e6e2d9]">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        width={64}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-muted">
                        No image
                      </span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold uppercase leading-tight">{item.product.name}</p>
                      {item.product.isDemo ? (
                        <span className="border border-ink px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.14em]">
                          Demo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-muted">Size {item.size}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="flex h-11 w-11 items-center justify-center border border-line text-sm font-bold transition-colors duration-200 hover:border-ink disabled:opacity-40"
                      >
                        -
                      </button>
                      <span aria-live="polite" className="min-w-8 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(index, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="flex h-11 w-11 items-center justify-center border border-line text-sm font-bold transition-colors duration-200 hover:border-ink disabled:opacity-40"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="ml-auto min-h-11 text-xs font-bold uppercase underline transition-opacity duration-200 hover:opacity-60"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="mt-2 font-bold">
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="space-y-3 border-t border-line pt-4">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Handling fee</span>
              <span>Rp {HANDLING_FEE.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-black">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>

            {hasDemoItem ? (
              <p className="border border-line bg-canvas p-3 text-xs text-muted">
                Checkout is unavailable in demo preview.
              </p>
            ) : null}

            <button
              type="button"
              onClick={onCheckout}
              disabled={isProcessing || hasDemoItem}
              className="w-full bg-ink py-4 text-xs font-bold uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-[#2b2b2b] disabled:opacity-50"
            >
              {hasDemoItem
                ? "Checkout unavailable in demo"
                : isProcessing
                  ? "Processing..."
                  : `Checkout ${cart.length} item${cart.length === 1 ? "" : "s"}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
