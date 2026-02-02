import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

interface SignatureCanvasProps {
  onEnd?: () => void;
  className?: string;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onEnd, className }, ref) => {
    const sigPadRef = useRef<SignaturePad>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigPadRef.current?.clear();
      },
      isEmpty: () => {
        return sigPadRef.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigPadRef.current?.toDataURL('image/png') ?? '';
      },
    }));

    const handleClear = () => {
      sigPadRef.current?.clear();
    };

    return (
      <div className={className}>
        <div className="signature-container">
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              className: 'w-full h-40 cursor-crosshair',
              style: { touchAction: 'none' }
            }}
            onEnd={onEnd}
          />
          <div className="absolute bottom-2 right-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2"
            >
              <Eraser className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Assine acima para confirmar a entrega
        </p>
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';
