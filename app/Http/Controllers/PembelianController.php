<?php

namespace App\Http\Controllers;

class PembelianController extends BaseDocumentController
{
    protected function getDocumentType(): string
    {
        return 'pembelian';
    }

    protected function getRoutePrefix(): string
    {
        return 'pembelian';
    }

    protected function getViewPrefix(): string
    {
        return 'pembelian';
    }

    public function reguler()
    {
        return $this->renderUploadPage('Reguler');
    }

    public function retur()
    {
        return $this->renderUploadPage('Retur');
    }

    public function urgent()
    {
        return $this->renderUploadPage('Urgent');
    }

}
