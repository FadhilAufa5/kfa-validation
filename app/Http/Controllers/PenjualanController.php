<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PenjualanController extends Controller
{

    public function index()
    {
        return Inertia::render('penjualan/index');
    }


    public function history()
    {
        return Inertia::render('penjualan/history');
    }
    public function create()
    {
        //
    }

    public function reguler()
    {
        return Inertia::render('penjualan/reguler');
    }

    public function ecommerce()
    {
        return Inertia::render('penjualan/ecommerce');
    }

    public function debitur()
    {
        return Inertia::render('penjualan/debitur');
    }

    public function konsi()
    {
        return Inertia::render('penjualan/konsi');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
